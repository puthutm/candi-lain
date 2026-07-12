# Product Requirements Document (PRD)
## Modul Keuangan UNSIA — SKEU & SKEUM

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL (database privat Keuangan — microservices) |
| Terkait | BRD-Keuangan-UNSIA.md, SI-PMB, SIAKAD, LMS, SSO Platform, HRIS (eksternal), CRM (eksternal) |

## 1. Ringkasan Produk

Modul Keuangan terdiri dari 2 portal: **Admin Keuangan (SKEU)** untuk Biro Keuangan, dan **Portal Keuangan Mahasiswa (SKEUM)** untuk mahasiswa. SKEU sendiri terbagi 6 area besar: Beranda & Kas, Penerimaan, Pengeluaran, Pajak & Kepatuhan, Akuntansi, dan Laporan.

## 2. User Roles

| Peran | Akses |
|---|---|
| Kepala Biro Keuangan | Akses penuh SKEU, approval PO < Rp 10 jt, generate laporan ke Yayasan |
| Staf Penerimaan | Kelola tagihan mahasiswa, beasiswa, verifikasi pembayaran non-PG |
| Staf Pengeluaran | Kelola PO, honor eksternal, disbursement payroll & komisi |
| Staf Akuntansi | Jurnal manual, CoA, RAB, laporan |
| WR II / Rektor / Yayasan | Approval berjenjang sesuai threshold (BR-06), penerima laporan triwulanan |
| Mahasiswa | SKEUM — lihat/bayar tagihan, ajukan keringanan |

## 3. Functional Requirements

### FR-1. Treasury Dashboard & Kas/Bank
- FR-1.1 Ringkasan real-time: pendapatan/pengeluaran bulan berjalan, piutang mahasiswa, saldo konsolidasi, jatuh tempo 7 hari, pending verifikasi.
- FR-1.2 Grafik arus kas konsolidasi (masuk/keluar/net) per bulan, dengan Total YTD.
- FR-1.3 "Perlu Perhatian" — daftar item aksi (payroll menunggu disburse, pembayaran perlu verifikasi, pajak jatuh tempo, PO menunggu approval, dsb).
- FR-1.4 Komposisi pendapatan per kategori (SPP+BOP, PMB, Wisuda, Kerjasama) dgn persentase & jumlah mahasiswa/unit terkait.
- FR-1.5 Multi-rekening: saldo per bank, mutasi terkini per rekening, transfer antar rekening internal.
- FR-1.6 Rekonsiliasi bank — deteksi selisih, status "sudah match"/"belum match".

### FR-2. Penerimaan Mahasiswa (SPP/UKT)
- FR-2.1 Master Tarif SPP/BOP per prodi per periode — edit **butuh approval Yayasan** (BR-01).
- FR-2.2 Generate tagihan massal per periode akademik (berdasar mahasiswa aktif per prodi dari SIAKAD).
- FR-2.3 Daftar tagihan dgn filter (prodi, status: outstanding/lunas/cicilan/beasiswa), klik VA untuk salin.
- FR-2.4 Rekonsiliasi Payment Gateway otomatis (Midtrans: VA semua bank, QRIS, Kartu Kredit) — auto-jurnal begitu pembayaran masuk.
- FR-2.5 Tombol "Force Re-sync PG" untuk penanganan darurat saat gagal sinkron.
- FR-2.6 Ringkasan channel pembayaran (VA/QRIS/Kartu Kredit/Manual) dgn share persentase.
- FR-2.7 Aging piutang & status collection rate per periode.

### FR-3. Penerimaan PMB (Sinkron dari SI-PMB)
- FR-3.1 Ringkasan gelombang aktif: total penerimaan, total pendaftar, funnel konversi (Pendaftar → Bayar Formulir → Bayar+Ikut Ujian → Lulus Seleksi → Daftar Ulang), masing-masing dgn nominal & persentase konversi.
- FR-3.2 Master tarif biaya PMB per komponen (Pendaftaran, Ujian Seleksi, Daftar Ulang, Matrikulasi).
- FR-3.3 Daftar pendaftar terkini dgn status pembayaran per tahap (read-only, sumber SI-PMB).

### FR-4. Beasiswa & Keringanan
- FR-4.1 Kelola Program Beasiswa: kode, nama, sumber dana (KIP-K/Internal/Mitra), jumlah penerima, nominal per mahasiswa/semester, status.
- FR-4.2 Pembebanan otomatis ke tagihan SPP mahasiswa penerima (BR-05) — status tagihan "Beasiswa" jika lunas penuh, "Cicilan" jika sisa harus dibayar.
- FR-4.3 Alur dana: pencairan dari sumber (Kemendikbud/Yayasan/Mitra) masuk ke rekening Yayasan → transfer ke rekening Penerimaan Mahasiswa untuk netting.
- FR-4.4 (Sisi SKEUM) Pengajuan Keringanan/Cicilan: pilih tagihan aktif, pilih skema (Cicilan 2x/3x, Penundaan), alasan, unggah dokumen pendukung (SKTM/PHK) — wajib (BR-04).
- FR-4.5 (Sisi Admin) Antrean approval pengajuan keringanan, dengan keputusan setuju/tolak + catatan.

### FR-5. Wisuda & Kegiatan Berbayar
- FR-5.1 Buat Event dgn cost-center sendiri: target pendapatan, estimasi pengeluaran, proyeksi surplus.
- FR-5.2 Komponen tarif per event (Biaya Wisuda, Sertifikat Ekstra, Toga Souvenir, dst).
- FR-5.3 Generate tagihan massal ke calon peserta (mis. wisudawan) berdasarkan data dari SIAKAD (status "kandidat lulus").
- FR-5.4 Pencatatan otomatis ke akun pendapatan kegiatan (4501) & beban event terkait.

### FR-6. Pengeluaran — Disbursement Payroll
- FR-6.1 Terima data payroll dari HRIS (read-only): total karyawan, gross, net (THP), potongan pajak & BPJS.
- FR-6.2 Pipeline disbursement bertahap (BR-08): Persiapan HRIS → Validasi Keuangan → Kalkulasi Pajak → Approval WR II → Disburse — status & timestamp tiap tahap terlihat jelas.
- FR-6.3 Generate file transfer bank (H2H) untuk disbursement massal ke rekening karyawan.
- FR-6.4 Rekap komponen payroll per akun GL, siap di-jurnal otomatis (preview jurnal sebelum posting).
- FR-6.5 Tombol "Re-sync HRIS" jika data belum sinkron.

### FR-7. Pengeluaran — Belanja & PO (Purchase Order)
- FR-7.1 Buat PO: vendor, item/jasa, kategori, nominal, jatuh tempo.
- FR-7.2 Approval berjenjang otomatis berdasar nominal (BR-06), dgn validasi 3 quotation utk PO > Rp 25 jt.
- FR-7.3 Status PO: Pending Approval / Approved / Paid.
- FR-7.4 Pemotongan pajak vendor otomatis sesuai jenis transaksi (BR-07).

### FR-8. Pengeluaran — Honor Eksternal
- FR-8.1 Tambah Honor: penerima, kegiatan/peran, bruto, jenis pajak berlaku otomatis (PPh21 progresif bukan pegawai tetap / PPh23), nominal dipotong, net dibayarkan.
- FR-8.2 Generate Bukti Potong otomatis (1721-A2 utk PPh21, 1721-VI utk PPh23), siap upload e-Bupot.

### FR-9. Pengeluaran — Komisi Referral (Sinkron dari CRM)
- FR-9.1 Terima antrean disbursement dari CRM (read-only): tipe program (Representatif/EGS/SGS/Kerjasama/Alumni), partner/agen, periode, pendaftar, fee.
- FR-9.2 Status antrean: Ready (siap dibayar) / Hold (menunggu validasi CRM).
- FR-9.3 Klik "Disburse" → jalur pembayaran sesuai tipe (transfer PG utk Representatif/Kerjasama, masuk payroll utk EGS, transfer rekening mahasiswa utk SGS, batch transfer utk Alumni) → status sync balik ke CRM sbg "Paid".
- FR-9.4 Ringkasan akumulasi komisi per tipe program (YTD/bulan berjalan/kuartal/semester).

### FR-10. Data Karyawan (Read-Only dari HRIS)
- FR-10.1 Daftar karyawan dgn filter (jenis, unit, status) — untuk keperluan payroll/pajak/BPJS saja, bukan untuk edit data kepegawaian.
- FR-10.2 Link "Buka HRIS" untuk pengelolaan penuh di modul asalnya.

### FR-11. Pajak & Kepatuhan
- FR-11.1 Ringkasan kewajiban pajak bulanan per jenis (PPh21/23/4(2)) dgn basis pemungutan & jatuh tempo setor.
- FR-11.2 Distribusi PPh21 per bracket tarif progresif.
- FR-11.3 Status pelaporan ke DJP: SPT Masa PPh21, SPT Masa PPh23/4(2) Unifikasi, e-Bupot Unifikasi, SPT Tahunan.
- FR-11.4 Generate ID Billing & e-Bupot.
- FR-11.5 Iuran BPJS: rincian per jenis (Kesehatan, JHT, JP, JKK, JKM), potongan karyawan vs iuran perusahaan sesuai tarif (PP 84/2013 & PP 82/2019), generate file SIPP.

### FR-12. Akuntansi
- FR-12.1 Chart of Accounts (CoA) — struktur baku (1xxx Aset, 2xxx Liabilitas, 3xxx Ekuitas, 4xxx Pendapatan, 5xxx Beban), dapat ditambah sub-akun.
- FR-12.2 Jurnal Umum — auto-post dari sub-modul (penerimaan, payroll, PO); jurnal manual hanya untuk koreksi/penyesuaian, dgn approval.
- FR-12.3 RAB (Rencana Anggaran Biaya) — pagu per unit/cluster disetujui Yayasan, realisasi YTD, sisa pagu, burn rate, indikator unit mendekati limit, alur pengajuan revisi.

### FR-13. Laporan Keuangan
- FR-13.1 Laporan Posisi Keuangan (Neraca) — format PSAK 45.
- FR-13.2 Laporan Aktivitas (L/R) — pendapatan, beban, surplus/defisit, pembanding bulan & YTD.
- FR-13.3 Laporan Arus Kas — metode langsung, per rekening/konsolidasi.
- FR-13.4 Anggaran vs Realisasi — variance analysis per cluster unit.
- FR-13.5 Aging Piutang Mahasiswa — per rentang umur tunggakan (0-30/31-60/61-90/90+ hari), per prodi/mahasiswa.
- FR-13.6 Laporan ke Yayasan — paket triwulanan (ringkasan + narasi).
- FR-13.7 Laporan pajak (SPT Masa CSV format DJP-online, e-Bupot XLSX).
- FR-13.8 Report Builder kustom — pilih akun/periode/dimensi sendiri, simpan sbg template.
- FR-13.9 Laporan operasional: Daftar Ulang per Prodi (target vs realisasi), Status Pembayaran Mahasiswa massal (export XLSX).

### FR-14. Portal Keuangan Mahasiswa (SKEUM)
- FR-14.1 Beranda: total tagihan aktif, jatuh tempo terdekat, status clearance ujian (tertahan/aman), pembayaran terakhir, tagihan mendatang.
- FR-14.2 Detail Tagihan Aktif: rincian komponen biaya, potongan/beasiswa, total, tombol "Lanjutkan Pembayaran".
- FR-14.3 Checkout Pembayaran: pilih saluran (VA Bank/QRIS), tampil detail pembayaran (No. VA dsb).
- FR-14.4 Riwayat Transaksi: daftar lunas dgn ID transaksi, deskripsi, tanggal, nominal, status, akses bukti/e-kuitansi.
- FR-14.5 Layanan Finansial → Pengajuan Keringanan/Cicilan (lihat FR-4.4).
- FR-14.6 Unduh e-Kuitansi.
- FR-14.7 Akses via SSO ("Kembali ke SSO Induk").

### FR-15. Pengaturan
- FR-15.1 Profil Biro (NPWP, status PKP, KPP terdaftar, tahun buku).
- FR-15.2 Tarif Biaya per Prodi (edit dgn approval Yayasan).
- FR-15.3 Multi-Bank Configuration (rekening & fungsinya).
- FR-15.4 Pajak Setup.
- FR-15.5 Integrasi Modul (SIAKAD, PMB, HRIS, CRM, Payment Gateway).
- FR-15.6 Setting Tagihan & Setting Pembayaran.
- FR-15.7 **Pembatasan LMS** — aturan kapan status tunggakan memicu pembatasan akses LMS/ujian (lihat FR-16).
- FR-15.8 Audit Log.

### FR-16. Status Clearance Finansial → SIAKAD/LMS
- FR-16.1 Status mahasiswa terhadap kewajiban finansial: `aktif` (lunas/tidak ada tunggakan menghambat) vs `tertahan` (ada tunggakan UKT aktif melewati batas).
- FR-16.2 Perubahan status **dipublikasikan otomatis** (event) ke SIAKAD & LMS — bukan proses manual per mahasiswa (BR-03).
- FR-16.3 Status yang terlihat di SIAKAD/data mahasiswa: "Aktif", "Aktif - LMS Dibatasi", "Aktif - LMS Suspend" (bertingkat sesuai keparahan tunggakan).

## 4. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Data finansial & NIK/NPWP terenkripsi; akses granular per sub-modul (Penerimaan/Pengeluaran/Akuntansi terpisah) |
| Integrasi | Payment Gateway (Midtrans) real-time webhook; SIAKAD (data mahasiswa & publish clearance); SI-PMB (funnel PMB); HRIS (payroll & karyawan, read-only); CRM (komisi & agen, read-only); LMS (pembatasan akses) |
| Auditability | Semua jurnal, approval PO, dan perubahan tarif tercatat lengkap aktor & waktu — krusial utk audit Yayasan/eksternal |
| Akurasi | Kalkulasi pajak & rekonsiliasi bank harus 100% akurat — kesalahan berdampak legal (pajak) dan finansial langsung |
| Ketersediaan | Rekonsiliasi Payment Gateway & pipeline payroll adalah proses kritis bulanan, harus tahan gangguan dgn mekanisme retry |
| Kepatuhan | Format laporan pajak & neraca mengikuti standar resmi (DJP, PSAK 45) — tidak boleh menyimpang dari template resmi |

## 5. Integrasi dengan Sistem Lain (Microservices)

Mengikuti pola `Catatan-Arsitektur-Microservices.md`:

- **Dengan SSO**: Keuangan didaftarkan sbg `application`, staf & mahasiswa login pakai token yang sama.
- **Dengan SIAKAD**: 
  - **Pull**: data mahasiswa aktif per prodi/periode (utk generate tagihan massal FR-2.2), status "kandidat lulus" (utk tagihan wisuda FR-5.3).
  - **Push (event)**: `finance.clearance_changed` → SIAKAD update status akademik terkait akses ujian (lihat FR-16, Flow Bisnis & Logic Aplikasi).
- **Dengan SI-PMB**: **Pull** data funnel pendaftaran & status pembayaran (FR-3) — Keuangan adalah **konsumen**, bukan pemilik data PMB.
- **Dengan LMS**: **Push (event)** `finance.clearance_changed` juga dikonsumsi LMS untuk membatasi akses (mis. blokir submit tugas/ujian LMS jika status "LMS Suspend").
- **Dengan HRIS (eksternal)**: **Pull read-only** data karyawan & hasil payroll run — Keuangan tidak pernah menulis balik ke HRIS.
- **Dengan CRM (eksternal)**: **Pull read-only** antrean disbursement komisi & master agen — status "Paid" **push kembali** ke CRM setelah disburse.
- **Dengan Payment Gateway (Midtrans)**: webhook real-time utk konfirmasi pembayaran (pola sama seperti idempotency webhook di Logic-Aplikasi-PMB.md §5).

## 6. Alur Utama (ringkas — detail di Flow Bisnis)

1. Awal periode: generate tagihan massal SPP/UKT ke seluruh mahasiswa aktif (sinkron data dari SIAKAD).
2. Mahasiswa lihat tagihan di SKEUM → bayar via Payment Gateway → webhook konfirmasi → auto-jurnal.
3. Jika lewat jatuh tempo tanpa bayar → status clearance berubah `tertahan` → event ke SIAKAD/LMS → akses ujian diblokir.
4. Mahasiswa bisa ajukan keringanan/cicilan sebelum/saat tertahan → admin approve/tolak.
5. Payroll: HRIS kirim data → pipeline validasi-pajak-approval → disburse → auto-jurnal.
6. Semua transaksi terkumpul di Jurnal Umum → jadi dasar Laporan Keuangan periodik.

## 7. Kebutuhan Data (Ringkas)

Lihat `ERD-Keuangan-UNSIA.mermaid` untuk skema lengkap. Ringkasan domain:
- **Master & Tarif**: `tuition_rates` (SPP/BOP per prodi), `pmb_fee_rates`, `scholarship_programs`, `chart_of_accounts`
- **Penerimaan**: `student_invoices`, `student_invoice_items`, `payments`, `installment_plans`, `installment_requests`
- **Pengeluaran**: `purchase_orders`, `po_approvals`, `external_honorariums`, `payroll_disbursements`, `payroll_disbursement_items`, `referral_disbursements`
- **Kas/Bank**: `bank_accounts`, `bank_mutations`, `internal_transfers`
- **Pajak**: `tax_withholdings`, `tax_reports`
- **Akuntansi**: `journal_entries`, `journal_entry_lines`, `budget_allocations` (RAB)
- **Governance**: `finance_clearance_status`, `sync_logs`, `audit_logs`

## 8. Roadmap

Sama seperti BRD §9 — Fase 1 (Penerimaan Mahasiswa + SKEUM + clearance dasar) → Fase 2 (Beasiswa, PMB sync, Wisuda) → Fase 3 (Pengeluaran & Payroll) → Fase 4 (Pajak & Akuntansi & Laporan penuh).

## 9. Open Questions

- Ambang tunggakan yang memicu `tertahan` — berapa hari lewat jatuh tempo, atau langsung saat jatuh tempo terlewati?
- Apakah "Aktif - LMS Dibatasi" vs "Aktif - LMS Suspend" punya kriteria & konsekuensi berbeda yang perlu didefinisikan eksplisit (mis. dibatasi = masih bisa lihat materi tapi tidak submit tugas; suspend = tidak bisa akses sama sekali)?
- Apakah integrasi HRIS & CRM sudah tersedia sbg service terpisah, atau masih rencana — perlu dikonfirmasi sebelum Fase 3.
- Kebijakan spesifik jika mahasiswa cicilan gagal bayar termin ke-2/3 — apakah otomatis batal & kembali ke tagihan penuh?
