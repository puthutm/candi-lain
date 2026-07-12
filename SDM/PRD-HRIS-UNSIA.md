# Product Requirements Document (PRD)
## HRIS — Human Resources Information System UNSIA

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL (**database privat `hris_db`**, arsitektur microservices) |
| Terkait | BRD-HRIS-UNSIA.md, ERD-HRIS-UNSIA.mermaid, Flow-Bisnis-HRIS-UNSIA.mermaid, Catatan-Arsitektur-Microservices.md |
| Sumber | Reverse-engineering mockup: `HRIS.html`, `SDM_Admins.html` |

---

## 1. Ringkasan Produk

HRIS UNSIA adalah sistem SDM & payroll terpadu dengan **satu portal Admin SDM** (14 area fungsional) yang menangani seluruh siklus hidup pegawai — Dosen & Tenaga Kependidikan (Tendik) — dari onboarding hingga payroll, terintegrasi dengan SIAKAD (data akademik dosen) dan Sistem Keuangan (disbursement).

## 2. Problem Statement

SDM UNSIA butuh satu sistem yang menyatukan data kepegawaian yang selama ini berpotensi tersebar (data dosen di SIAKAD, presensi terpisah, payroll manual, pelaporan ke PDDikti/SISTER manual), dengan proses payroll bulanan yang kompleks (melibatkan komponen khusus dosen seperti BKD & Serdos) dan kepatuhan pajak yang harus akurat.

## 3. Goals & Non-Goals

**Goals**
- Direktori pegawai tunggal, akurat, dan real-time untuk Dosen & Tendik.
- Payroll bulanan berjalan sebagai proses bertahap yang transparan dan dapat diaudit.
- Data BKD dosen tersinkron otomatis dari SIAKAD tanpa entri ulang.
- Kepatuhan pajak (PPh21) & BPJS terhitung otomatis dan akurat.
- Penilaian kinerja (SKP/BKD/Survei 360°) terdokumentasi sebagai dasar keputusan mutasi/promosi.

**Non-Goals (Fase 1)**
- Rekrutmen dari awal (job posting, seleksi kandidat) — hanya titik onboarding pegawai yang sudah diterima.
- Submit otomatis penuh ke sistem pajak negara (e-Bupot/DJP) — Fase 1 cukup kalkulasi & rekap siap-setor.
- Implementasi detail protokol integrasi PDDikti/SISTER/BIMA — ditentukan di fase teknis terpisah dengan pihak terkait.

## 4. User Roles / Personas

| Peran | Akses | Deskripsi |
|---|---|---|
| **Pegawai (Dosen/Tendik)** | Self-service terbatas (di luar scope Admin SDM ini — portal pegawai terpisah, lihat Open Questions) | Lihat slip gaji, ajukan cuti, lihat BKD/SKP sendiri |
| **Admin Data SDM** | Panel Karyawan, Struktur, Mutasi, Pelatihan | Kelola direktori, onboarding, struktur jabatan, mutasi/promosi |
| **Admin Payroll & Pajak** | Panel Payroll, Slip, Komponen, Pajak | Jalankan run payroll, kelola komponen gaji, kalkulasi pajak/BPJS |
| **Atasan/Approver** (Kaprodi, Kabiro) | Approval cuti, SKP, BKD, SK Mutasi di unit masing-masing | Menyetujui pengajuan bawahan |
| **Super Admin SDM** | Seluruh panel + Pengaturan | Konfigurasi sistem, integrasi, user & hak akses, audit log |

> Role di atas — Admin Data SDM, Admin Payroll & Pajak, Atasan/Approver, Super Admin SDM — persis mencerminkan **dynamic role per aplikasi** di SSO Platform: "HRIS" didaftarkan sebagai satu `application`, role-role ini menjadi isi `application_roles` miliknya.

## 5. Functional Requirements

### FR-A. Dashboard

- FR-A.1 Ringkasan eksekutif: total karyawan aktif, breakdown Dosen/Tendik per unit, % Serdos, total payroll bulan berjalan.
- FR-A.2 Status run payroll periode berjalan (tahapan & progres).
- FR-A.3 Ringkasan kehadiran hari ini (Hadir tepat waktu/Terlambat/WFH/Cuti).

### FR-B. Direktori Pegawai (Karyawan)

- FR-B.1 Tabel pegawai dengan kolom: Nama, NIDN/NIP, Unit, Jabatan, Golongan, Gaji Pokok, Status.
- FR-B.2 Filter: Tipe (Dosen/Tendik), Unit/Prodi/Biro, Status (Aktif/Non-Aktif/Pensiun/Cuti Panjang).
- FR-B.3 Profil biodata mendalam per pegawai (biodata, kontrak, rekening pencairan payroll, riwayat jabatan).
- FR-B.4 Export data direktori.
- FR-B.5 **Onboarding pegawai baru**: entitas sementara (status "Draf/Onboarding") dengan indikator persentase kelengkapan data sebelum berpindah status menjadi Aktif penuh di direktori.
- FR-B.6 Tombol "Push SISTER" — mendorong data portofolio dosen ke sistem nasional SISTER/PDDikti.

### FR-C. Presensi

- FR-C.1 Rekap kehadiran harian per pegawai: Hadir (H), Terlambat (T), WFH/Dinas Luar (W), Cuti (C), Alpha (A).
- FR-C.2 Ringkasan agregat: tingkat kehadiran %, rata-rata jam kerja, total keterlambatan, pegawai belum absen hari ini.

### FR-D. Cuti & Lembur

- FR-D.1 Master jenis cuti: Cuti Tahunan, Sakit, Izin, Dinas Luar, Lembur, Cuti Besar.
- FR-D.2 Inbox persetujuan cuti untuk atasan/approver, dengan filter per unit.
- FR-D.3 Saldo cuti per pegawai, riwayat pengajuan.
- FR-D.4 Admin dapat mengajukan cuti atas nama pegawai (kondisi khusus).

### FR-E. Struktur & Jabatan

- FR-E.1 Struktur organisasi unit/fakultas/biro.
- FR-E.2 Master jabatan: nama, singkatan, tunjangan fungsional, golongan/pangkat terkait, jumlah pemegang jabatan saat ini.

### FR-F. Mutasi & Promosi

- FR-F.1 Buat SK baru: Mutasi Antar Unit, Promosi Jabatan (fungsional/struktural).
- FR-F.2 Validasi syarat sebelum SK diajukan (mis. angka kredit minimum untuk kenaikan jenjang fungsional dosen).
- FR-F.3 Alur persetujuan berjenjang, status Pending Approval → Disetujui/Ditolak, dengan TMT (Tanggal Mulai Terhitung).
- FR-F.4 Daftar kandidat yang memenuhi syarat kenaikan pangkat (mis. berdasarkan akumulasi angka kredit).
- FR-F.5 Riwayat SK per pegawai.

### FR-G. Payroll

- FR-G.1 Run payroll bertahap 5 langkah: **Persiapan Data Master → Validasi Absensi & BKD → Kalkulasi Gross & Net → Persetujuan → Disburse & Slip**, masing-masing dengan status (Selesai/Berjalan/Pending) dan aktor/waktu penyelesaian.
- FR-G.2 Tahap Validasi menarik data absensi & BKD dari **SIAKAD** secara otomatis; anomali ditampilkan untuk dikoreksi manual sebelum lanjut.
- FR-G.3 Tahap Kalkulasi menghitung Gross, Potongan (BPJS/PPh21), dan Net (Take Home Pay) per pegawai; item tertentu (mis. tunjangan kehadiran) dapat ditandai butuh review.
- FR-G.4 Ringkasan periode: jumlah karyawan eligible, total Gross, total Net.
- FR-G.5 Setelah disburse, sistem mengirim instruksi pencairan ke **Sistem Keuangan** dan mempublikasikan slip gaji.

### FR-H. Slip Gaji

- FR-H.1 Slip gaji per pegawai berisi: identitas (NIP/NIDN, unit, jabatan), periode & kehadiran, rincian pendapatan (gaji pokok, tunjangan fungsional, tunjangan Serdos, dst.), potongan, status bayar.
- FR-H.2 Aksi: Cetak PDF, Kirim Email, Distribusi Massal ke seluruh pegawai eligible periode berjalan.
- FR-H.3 Riwayat slip gaji per periode (bulan berjalan & bulan-bulan sebelumnya).

### FR-I. Komponen Gaji

- FR-I.1 Master komponen gaji dikategorikan: Pendapatan, Potongan, Tunjangan, Sertifikasi, Skema Khusus.
- FR-I.2 Tiap komponen memiliki: nama, tipe (Tetap/Variabel), aturan perhitungan, status kena-pajak atau tidak, status aktif/nonaktif.

### FR-J. Pajak & BPJS

- FR-J.1 Kalkulasi PPh21 bulanan per pegawai berdasarkan bracket tarif progresif (5%/15%/25%/30%, dst. sesuai regulasi berlaku — bracket harus dapat dikonfigurasi).
- FR-J.2 Distribusi jumlah pegawai & total pajak per bracket sebagai insight.
- FR-J.3 Kalkulasi iuran BPJS Kesehatan & BPJS Ketenagakerjaan (JHT, JP, JKK, JKM).
- FR-J.4 Riwayat penyetoran bulanan ke DJP (status: sudah disetor/belum) dan ringkasan PPh21 tahun berjalan (YTD).
- FR-J.5 Generate e-Bupot per karyawan.

### FR-K. BKD Dosen (Beban Kerja Dosen)

- FR-K.1 Tabel BKD per dosen dengan 4 komponen: **P&P** (Pendidikan & Pengajaran), **PNL** (Penelitian), **PkM** (Pengabdian kepada Masyarakat), **PNJ** (Penunjang), serta Total SKS dan status Serdos.
- FR-K.2 Data ini menjadi sumber acuan tunjangan fungsional & Serdos di payroll (lihat FR-G.2) — ditarik dari SIAKAD.
- FR-K.3 Status persetujuan BKD per dosen per periode (mis. oleh Kaprodi).

### FR-L. SKP / Penilaian Kinerja

- FR-L.1 Tiga jalur penilaian: **SKP Tendik**, **Penilaian Dosen**, **Survei 360°**, dengan halaman **Konfigurasi** bobot/periode penilaian.
- FR-L.2 Skor SKP = Sasaran Kerja (60%) + Perilaku Kerja (40%) → Nilai Akhir → Predikat (mis. Sangat Baik/Baik/Cukup/Kurang).
- FR-L.3 Progres penilaian ditampilkan agregat (mis. "87/105 tendik sudah dinilai").

### FR-M. Pelatihan & Sertifikasi

- FR-M.1 Kalender program pelatihan & sertifikasi dengan status (Berjalan/Pendaftaran Aktif/Selesai).
- FR-M.2 Peserta dapat mendaftar (dari sisi pegawai) — Admin memantau kuota/slot tersedia.
- FR-M.3 Daftar sertifikat aktif per pegawai dengan **reminder kadaluarsa berjenjang** (tampil ketika tersisa ≤ 6 bulan), tombol perpanjang.

### FR-N. Laporan

- FR-N.1 Pusat pelaporan dengan laporan standar siap unduh (PDF/XLSX): Komposisi Karyawan, Turnover & Retensi, Rekap Payroll Bulanan, Rekap Absensi & Kehadiran, Rekap BKD Dosen, dan lainnya (total 9 laporan standar pada mockup).
- FR-N.2 Report Builder untuk tarik data kustom (di luar 9 laporan standar).

### FR-O. Pengaturan

- FR-O.1 Profil Institusi (nama, alamat, NPWP, bank payroll, rektor, tahun akademik aktif) — data ini dipakai di slip gaji, SK, dan laporan eksternal.
- FR-O.2 Kalender & Hari Libur (memengaruhi perhitungan hari kerja/presensi).
- FR-O.3 Parameter Payroll (bracket pajak, tarif BPJS, dsb. — harus versioned/bertanggal-berlaku, lihat NFR).
- FR-O.4 User & Hak Akses (role staff SDM, terhubung ke SSO — lihat bagian 7).
- FR-O.5 **Integrasi Sistem**: status koneksi ke SIAKAD (sync dosen, BKD, jadwal mengajar) dan Sistem Keuangan (disbursement, jurnal akuntansi), dengan indikator "last sync" & status Terhubung/Terputus.
- FR-O.6 Audit Log — riwayat seluruh perubahan data & approval.
- FR-O.7 Notifikasi & Email — konfigurasi kanal & template notifikasi.

## 6. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Data gaji, rekening bank, NIK/NPWP terenkripsi; akses berbasis role ketat; audit log wajib untuk seluruh modul payroll |
| Kepatuhan (Compliance) | Parameter pajak (PPh21) & BPJS harus versioned (berlaku per rentang tanggal), tidak boleh hardcode, agar dapat diaudit histori perhitungannya |
| Akurasi | Kalkulasi payroll harus reproducible — hasil kalkulasi periode lampau tidak boleh berubah walau parameter terbaru diubah |
| Auditability | Setiap tahap run payroll & approval SK tercatat lengkap dengan aktor & waktu |
| Ketersediaan | Sistem payroll harus stabil menjelang deadline disburse (periode kritis bulanan) |
| Integrasi | Read-only pull terjadwal dari SIAKAD (BKD/jadwal/absensi dosen); webhook keluar ke Sistem Keuangan untuk instruksi disbursement; push data ke PDDikti/SISTER/BIMA |
| Skalabilitas | Mendukung pertumbuhan jumlah pegawai tanpa perubahan arsitektur (baseline saat ini 247 pegawai) |

## 7. Integrasi dengan Ekosistem ERP UNSIA

Mengikuti pola `Catatan-Arsitektur-Microservices.md` (database-per-service, API + event/webhook):

- **Dengan SSO Platform**: HRIS didaftarkan sebagai `application`; staf SDM & atasan/approver login pakai token SSO yang sama dengan modul lain. Role dinamis: `admin_data_sdm`, `admin_payroll`, `approver`, `super_admin_sdm`.
- **Dengan SIAKAD**: HRIS adalah **konsumen** data BKD, jadwal mengajar, dan dosen pengampu — pull terjadwal (dipakai di tahap Payroll FR-G.2), read-only, tidak menulis balik ke `siakad_db`.
- **Dengan Sistem Keuangan**: HRIS **publish event/webhook** `payroll.disbursement_ready` berisi rincian per pegawai (rekening, jumlah net) setelah tahap Persetujuan (FR-G.1) selesai; Sistem Keuangan yang mengeksekusi pencairan aktual & mencatat jurnal — HRIS tidak memegang kewenangan transaksi keuangan riil.
- **Dengan sistem nasional (PDDikti/SISTER/BIMA)**: HRIS **push** data portofolio dosen (BKD, publikasi, sertifikasi) satu arah keluar — detail protokol/format menyusul di fase teknis, kemungkinan berupa API resmi Kemendikbudristek atau ekspor berkas terstandar.

## 8. Alur Utama (ringkas — detail di Flow Bisnis)

**Alur A — Siklus Hidup Pegawai**: Onboarding (checklist kelengkapan) → Aktif di direktori → berjalan rutin (presensi, cuti, SKP/BKD) → (opsional) Mutasi/Promosi → Non-Aktif/Pensiun.

**Alur B — Run Payroll Bulanan**: Persiapan Data → Validasi Absensi & BKD (tarik SIAKAD, koreksi anomali) → Kalkulasi Gross/Net (PPh21 & BPJS) → Persetujuan → Disburse (kirim ke Sistem Keuangan) & Distribusi Slip.

## 9. Kebutuhan Data (Ringkas)

Lihat `ERD-HRIS-UNSIA.mermaid` untuk skema lengkap. Ringkasan domain:

- **Kepegawaian**: `employees`, `employee_onboarding`, `positions`, `organization_units`, `employment_status_history`
- **Presensi & Cuti**: `attendances`, `leave_types`, `leave_requests`, `leave_balances`
- **Mutasi & Promosi**: `mutation_letters` (SK), `credit_point_records` (angka kredit)
- **Payroll**: `payroll_runs`, `payroll_run_steps`, `payroll_components`, `employee_payroll_items`, `payslips`
- **Pajak & BPJS**: `tax_brackets` (versioned), `tax_calculations`, `bpjs_contributions`, `tax_filings`
- **BKD & Kinerja**: `lecturer_workloads` (BKD), `performance_evaluations` (SKP/Penilaian Dosen/360°)
- **Pelatihan**: `training_programs`, `training_enrollments`, `certifications`
- **Governance**: `sync_logs`, `audit_logs`, `institution_settings`

## 10. Rencana Rilis (High-Level)

| Fase | Cakupan |
|---|---|
| Fase 1 (MVP) | Direktori Pegawai + Onboarding, Presensi, Cuti, Struktur & Jabatan, Payroll dasar (5 tahap) + Slip, Komponen Gaji, Pajak & BPJS dasar |
| Fase 2 | Mutasi & Promosi (dengan validasi angka kredit), BKD Dosen (integrasi SIAKAD penuh), SKP/Penilaian Kinerja |
| Fase 3 | Pelatihan & Sertifikasi (dengan reminder), Laporan lengkap + Report Builder, integrasi PDDikti/SISTER/BIMA, integrasi penuh Sistem Keuangan |

## 11. Open Questions

- Apakah pegawai (Dosen/Tendik) punya **portal self-service terpisah** (ajukan cuti sendiri, lihat slip sendiri) di luar Admin SDM ini, atau semua serba diinput/dilihat lewat Admin SDM oleh staf? Mockup yang dianalisis (`HRIS.html`, `SDM_Admins.html`) keduanya tampak sebagai sisi **admin**, bukan sisi pegawai — perlu klarifikasi apakah ada mockup portal pegawai terpisah.
- Bagaimana relasi persis `HRIS.html` vs `SDM_Admins.html` — apakah `SDM_Admins.html` adalah versi awal/prototipe cepat, dashboard eksekutif terpisah untuk pimpinan, atau modul onboarding yang berdiri sendiri sebelum data masuk ke `HRIS.html`?
- Detail teknis integrasi PDDikti/SISTER/BIMA (format data, kredensial, frekuensi push) — perlu koordinasi dengan pihak terkait di kampus/Kemendikbudristek.
- Apakah perhitungan angka kredit dosen (untuk syarat kenaikan pangkat) dihitung otomatis oleh sistem dari data BKD/publikasi, atau tetap input manual oleh SDM?
- Kebijakan retensi/arsip data pegawai non-aktif/pensiun — berapa lama data tetap aktif dapat diakses sebelum diarsipkan?
