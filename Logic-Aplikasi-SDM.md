# Logic Aplikasi — HRIS / SDM UNSIA

| Metadata | Keterangan |
|---|---|
| Terkait | BRD-HRIS-UNSIA.md, PRD-HRIS-UNSIA.md, ERD-HRIS-UNSIA.mermaid, Flow-Bisnis-HRIS-UNSIA.mermaid, Flow-Bisnis-HRIS-UNSIA-Payroll.mermaid |
| Tujuan | Menjabarkan algoritma/aturan bisnis konkret, state machine, dan logika kalkulasi PPh21 TER & BPJS untuk platform SDM |
| Versi | 1.0 — 27 Juli 2026 |

---

## 1. State Machine — Siklus Kepegawaian & Onboarding

```
onboarding_draf ──lengkapi berkas biodata & dokumen──▶ onboarding_proses
    ──verifikasi biro SDM lunas──▶ aktif ──pengajuan cuti panjang/studi──▶ cuti_panjang
    ──tindakan disiplin / penonaktifan──▶ non_aktif
    ──mencapai usia pensiun / pengunduran diri──▶ pensiun
```

**Aturan transisi:**
- Status `aktif` mensyaratkan kelengkapan data wajib: NIP/NIDN, Nama Lengkap, Unit Kerja, Jabatan, Rekening Bank Valid, NPWP/PTKP Status, dan BPJS.
- Setiap perubahan status wajib mencatat riwayat di `employment_status_history` (`from_status`, `to_status`, `changed_by`, `note`, `changed_at`).
- Pegawai berstatus `non_aktif` atau `pensiun` secara otomatis dikecualikan dari perhitungan payroll periode berjalan (*eligibleEmployeeCount*).

---

## 2. State Machine — Payroll Engine 5-Tahap (`payroll_run_steps`)

```
[Tahap 1: persiapan_data] ──selesai kunci daftar pegawai──▶ [Tahap 2: validasi_absensi_bkd]
    ──selesai/fallback manual──▶ [Tahap 3: kalkulasi]
    ──selesai kalkulasi gross/net TER & BPJS──▶ [Tahap 4: persetujuan]
    ──setelah di-approve berjenjang──▶ [Tahap 5: disburse_slip] ──pembayaran & terbit slip──▶ selesai
```

**Aturan transisi:**
- Setiap tahap harus berjalan berurutan (*sequential*). Suatu tahap tidak dapat dijalankan jika tahap sebelumnya belum berstatus `selesai`.
- Setiap tahap mencatat `processed_by`, `completed_at`, dan `anomaly_note` apabila terjadi fallback atau penyesuaian data.

---

## 3. Algoritma Kalkulasi PPh21 TER (PP 58/2023 & PMK 168/2023)

```
FUNGSI hitung_pph21_ter(gross_salary, ptkp_status, has_npwp):
    // 1. Tentukan Kategori TER berdasarkan Status PTKP
    ptkp = UPPER(ptkp_status)
    JIKA ptkp DI DALAM ["TK/0", "TK/1", "K/0"]:
        kategori = "TER_A"
    ATAU JIKA ptkp DI DALAM ["TK/2", "TK/3", "K/1", "K/2"]:
        kategori = "TER_B"
    ATAU JIKA ptkp == "K/3":
        kategori = "TER_C"
    LAINNYA:
        kategori = "TER_A" // default fallback

    // 2. Cari Persentase Tarif Berdasarkan Rentang Penghasilan Bruto Bulanan
    tarif_percent = GET_TER_RATE(gross_salary, kategori)

    // 3. Penalti NPWP (20% lebih tinggi jika tidak memiliki NPWP)
    JIKA has_npwp == false DAN tarif_percent > 0:
        tarif_percent = tarif_percent * 1.20

    // 4. Hitung Nominal PPh21
    pph21_amount = ROUND((gross_salary * tarif_percent) / 100)

    KEMBALIKAN { kategori, tarif_percent, pph21_amount }
```

**Tabel Rentang Ringkas TER A (Contoh Implementasi):**
- Bruto $\le$ Rp 5.400.000 $\rightarrow$ 0%
- Rp 5.400.001 - Rp 5.650.000 $\rightarrow$ 0.25%
- Rp 5.650.001 - Rp 5.950.000 $\rightarrow$ 0.50%
- Rp 5.950.001 - Rp 6.300.000 $\rightarrow$ 0.75%
- Rp 6.300.001 - Rp 6.750.000 $\rightarrow$ 1.00%
- Rp 6.750.001 - Rp 7.500.000 $\rightarrow$ 1.25%
- Rp 7.500.001 - Rp 8.550.000 $\rightarrow$ 1.50%

---

## 4. Algoritma Perhitungan BPJS Kesehatan & Ketenagakerjaan

```
FUNGSI hitung_bpjs(base_salary, functional_allowance):
    gaji_dasar = base_salary + functional_allowance

    // BPJS Kesehatan Pekerja: 1% dari Gaji Dasar (Maksimal Cap Rp 12.000.000)
    cap_kesehatan = MIN(gaji_dasar, 12000000)
    bpjs_kesehatan = ROUND(cap_kesehatan * 0.01)

    // BPJS Ketenagakerjaan Pekerja: JHT (2%) + JP (1% dengan Maksimal Cap Rp 10.547.400)
    jht = ROUND(gaji_dasar * 0.02)
    cap_jp = MIN(gaji_dasar, 10547400)
    jp = ROUND(cap_jp * 0.01)
    bpjs_ketenagakerjaan = jht + jp

    KEMBALIKAN { bpjs_kesehatan, bpjs_ketenagakerjaan }
```

---

## 5. Algoritma Kalkulasi Payroll Total (Gross ke Net)

```
FUNGSI hitung_payroll_pegawai(input_pegawai):
    base = input_pegawai.base_salary
    tunjangan_jabatan = input_pegawai.functional_allowance
    tunjangan_bkd = input_pegawai.bkd_allowance
    tunjangan_lain = input_pegawai.other_allowances
    potongan_terlambat = input_pegawai.late_deduction

    gross_salary = base + tunjangan_jabatan + tunjangan_bkd + tunjangan_lain

    bpjs = hitung_bpjs(base, tunjangan_jabatan)
    pajak = hitung_pph21_ter(gross_salary, input_pegawai.ptkp_status, input_pegawai.has_npwp)

    total_deductions = potongan_terlambat + bpjs.bpjs_kesehatan + bpjs.bpjs_ketenagakerjaan + pajak.pph21_amount
    net_salary = MAX(0, gross_salary - total_deductions)

    KEMBALIKAN {
        gross_salary,
        total_deductions,
        bpjs_kesehatan: bpjs.bpjs_kesehatan,
        bpjs_ketenagakerjaan: bpjs.bpjs_ketenagakerjaan,
        pph21_amount: pajak.pph21_amount,
        net_salary
    }
```

---

## 6. Persetujuan Berjenjang & Disburse Payroll

```
SAAT Tahap 4 (persetujuan) dijalankan:
    INSERT INTO payroll_approvals (payroll_run_id, approver_role, status)
    VALUES
        (run_id, 'admin_payroll', 'approved'),
        (run_id, 'kabag_sdm', 'pending'),
        (run_id, 'warek_2', 'pending')

FUNGSI approve_payroll(run_id, role, approver_name, keputusan, catatan):
    UPDATE payroll_approvals
    SET status = keputusan, notes = catatan
    WHERE payroll_run_id = run_id AND approver_role = role

    JIKA SELURUH role ('admin_payroll', 'kabag_sdm', 'warek_2') SUDAH 'approved':
        UPDATE payroll_run_steps SET status = 'selesai' WHERE step_name = 'persetujuan'
        UPDATE payroll_run_steps SET status = 'berjalan' WHERE step_name = 'disburse_slip'
```

---

## 7. Generasi & Penerbitan Slip Gaji (E-Payslip)

```
SAAT Tahap 5 (disburse_slip) diselesaikan:
    UNTUK SETIAP pegawai DI DALAM active_employees:
        res = hitung_payroll_pegawai(pegawai)
        INSERT INTO payslips (
            payroll_run_id, employee_id, gross_salary, pph21_amount,
            bpjs_kesehatan_amount, bpjs_ketenagakerjaan_amount,
            total_deductions, net_salary, status, pdf_url
        ) VALUES (
            run_id, pegawai.id, res.gross_salary, res.pph21_amount,
            res.bpjs_kesehatan, res.bpjs_ketenagakerjaan,
            res.total_deductions, res.net_salary, 'published',
            f"/api/portal/payslip/{run_id}?employeeId={pegawai.id}"
        )

    UPDATE payroll_runs SET status = 'selesai' WHERE id = run_id
    PUBLISH LOG / EVENT "payroll.disbursement_ready"
```

---

## 8. Ringkasan Edge Cases & Kepatuhan Keamanan

| Skenario Edge Case | Penanganan Logis di Kode |
|---|---|
| Gagal koneksi ke DB SIAKAD saat Tahap 2 | Fallback otomatis ke data rekap presensi lokal & input manual tanpa menghentikan run payroll. Anomali dicatat di `anomaly_note`. |
| Pegawai baru masuk di tengah periode payroll | Gaji dihitung prorata berdasarkan jumlah hari aktif sejak `join_date` hingga `cutoff_date`. |
| Perubahan parameter pajak di pertengahan tahun | Menggunakan tabel `tax_brackets` versi ber-tanggal (`effective_from` dan `effective_to`) sehingga hasil run payroll terdahulu tetap reproducible. |
| Akses slip gaji oleh pegawai lain | Validasi sesi SSO JWT: Pegawai biasa hanya berhak mengunduh slip gaji dengan `employee_id` yang terhubung dengan `sso_user_id` milik dirinya sendiri. |
