# Business Requirements Document (BRD)
## Modul Keuangan UNSIA — SKEU (Sistem Keuangan Terpadu) & SKEUM (Portal Keuangan Mahasiswa)

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Terkait | SI-PMB, SIAKAD, LMS, SSO Platform, dan (via integrasi read-only) modul HRIS & CRM |
| Sumber | Reverse-engineering mockup: `ADMIN_KEUANGAN.html`, `KEUANGAN_MAHASISWA.html` |

## 1. Ringkasan Bisnis

Modul Keuangan adalah **pusat kendali finansial UNSIA** — mengelola seluruh arus kas (Kas & Bank multi-rekening), penerimaan dari mahasiswa (SPP/UKT, PMB, Wisuda), pengeluaran (payroll, belanja/PO, honor eksternal, komisi referral CRM), kepatuhan pajak & BPJS, serta akuntansi (jurnal, buku besar, RAB, laporan keuangan) — dilengkapi **Portal Keuangan Mahasiswa (SKEUM)** sebagai sisi mahasiswa untuk melihat & melunasi tagihan sendiri.

## 2. Latar Belakang & Problem Statement

Universitas butuh satu sumber kebenaran finansial yang menyatukan data dari berbagai modul lain (PMB, SIAKAD, HRIS, CRM) tanpa Biro Keuangan harus input ulang manual — sekaligus memberi mahasiswa transparansi penuh atas kewajiban finansialnya dan opsi pembayaran yang fleksibel (cicilan/keringanan) tanpa harus datang ke kampus.

## 3. Tujuan Bisnis

- Biro Keuangan punya **dashboard real-time** atas posisi kas, piutang mahasiswa, dan kewajiban (payroll, pajak, vendor) di satu tempat.
- Penerimaan dari mahasiswa (SPP/UKT, PMB) **terekonsiliasi otomatis** lewat Payment Gateway — tanpa pencocokan manual.
- **Kepatuhan pajak & BPJS** (PPh21/23/4(2), e-Bupot, iuran BPJS) terkelola sistematis dengan jejak audit lengkap.
- Mahasiswa bisa **melihat & melunasi tagihan sendiri**, serta **mengajukan keringanan/cicilan** tanpa proses manual berbelit.
- **Status finansial mahasiswa terhubung otomatis** ke SIAKAD/LMS — tunggakan aktif memblokir akses ujian, transparan dan tidak butuh eskalasi manual.
- Laporan keuangan (Neraca, Aktivitas/L-R, Arus Kas, Anggaran vs Realisasi) siap untuk kebutuhan Yayasan & audit, format PSAK 45 (entitas nirlaba).

## 4. Ruang Lingkup

**Termasuk:**
- Treasury Dashboard & Kas/Bank multi-rekening (mutasi, saldo real-time, transfer antar rekening).
- Penerimaan Mahasiswa: tarif SPP/BOP per prodi, generate & kelola tagihan, rekonsiliasi Payment Gateway otomatis.
- Penerimaan PMB: sinkron funnel pendaftaran (biaya pendaftaran, ujian, daftar ulang) dari SI-PMB.
- Beasiswa & Keringanan: program beasiswa (KIP-K, internal), pembebanan otomatis ke tagihan, pengajuan cicilan/keringanan mahasiswa.
- Wisuda & Kegiatan Berbayar: cost-center per event.
- Pengeluaran: Disbursement Payroll (sinkron dari HRIS, read-only sumber data — approval & disburse di Keuangan), Belanja & PO (approval berjenjang + threshold), Honor Eksternal (pemotongan pajak otomatis), Komisi Referral CRM (disbursement, read-only master data agen dari CRM).
- Data Karyawan: **view read-only** dari modul HRIS untuk keperluan payroll/pajak/BPJS.
- Pajak & Kepatuhan: kalkulasi & pelaporan PPh21/23/4(2), e-Bupot, BPJS.
- Akuntansi: Chart of Accounts, Jurnal Umum (auto-post dari sub-modul + manual utk koreksi), RAB/Anggaran per unit.
- Laporan Keuangan: Neraca, L/R, Arus Kas, Anggaran vs Realisasi, Aging Piutang, Laporan ke Yayasan, pelaporan pajak, Report Builder kustom.
- Portal Keuangan Mahasiswa (SKEUM): lihat tagihan, bayar, riwayat transaksi, ajukan keringanan/cicilan, unduh e-kuitansi.

**Tidak termasuk (di luar scope, ranah modul lain):**
- Data karyawan & payroll run itu sendiri — dikelola HRIS, Keuangan hanya menerima hasil & mendisburse.
- Setting komisi/struktur agen & referral — dikelola CRM, Keuangan hanya mencairkan sesuai antrean.
- Data akademik (KRS, nilai) — tetap di SIAKAD; Keuangan hanya **mengonsumsi** status akademik (prodi, semester) untuk keperluan penagihan & **mempublikasikan** status clearance finansial ke SIAKAD.

## 5. Stakeholder / Aktor

| Aktor | Kepentingan |
|---|---|
| Kepala Biro Keuangan | Kendali penuh treasury, approval, laporan ke Yayasan |
| Staf Keuangan (Penerimaan/Pengeluaran/Akuntansi) | Operasional harian sesuai sub-modul |
| Mahasiswa | Lihat & lunasi tagihan sendiri, ajukan keringanan |
| WR II / Rektor / Yayasan | Approval berjenjang untuk PO & pengeluaran besar, penerima laporan |
| Biro SDM (HRIS) | Sumber data payroll & karyawan (pihak lain, integrasi read-only) |
| Modul CRM | Sumber data agen/referral & antrean komisi (integrasi read-only) |
| DJP / BPJS (eksternal) | Penerima pelaporan pajak & iuran |

## 6. Aturan Bisnis (Business Rules)

| # | Aturan |
|---|---|
| BR-01 | Tarif SPP/BOP per prodi hanya bisa diubah dengan **approval Yayasan** — tidak bisa diedit bebas oleh staf |
| BR-02 | Semua pembayaran via Payment Gateway (VA/QRIS/Kartu Kredit) **terekonsiliasi & terjurnal otomatis** — admin tidak generate VA manual |
| BR-03 | Mahasiswa dengan **tunggakan UKT aktif** berstatus *clearance tertahan* — sistem memblokir akses UTS/UAS (via publish status ke SIAKAD/LMS), bukan keputusan manual staf per kasus |
| BR-04 | Pengajuan keringanan/cicilan mahasiswa **wajib** dilampiri dokumen pendukung (SKTM/Surat PHK dsb) — maksimal dibagi 3x termin |
| BR-05 | Mahasiswa penerima beasiswa otomatis mendapat tagihan dengan komponen pengurang; jika beasiswa < SPP, sisa jadi kewajiban mahasiswa (bisa dicicil) |
| BR-06 | Approval PO berjenjang berdasar nominal: **< Rp 10 jt** → Kepala Biro Keuangan; **Rp 10–100 jt** → WR II; **> Rp 100 jt** → Rektor + Yayasan. PO **> Rp 25 jt wajib 3 quotation** |
| BR-07 | Pemotongan pajak honor/vendor otomatis sesuai jenis: PPh21 progresif (bukan pegawai tetap), PPh23 2%/4% (jasa, tergantung NPWP), PPh4(2) final 10% (sewa bangunan) — UNSIA **bukan PKP** sehingga tidak memungut PPN |
| BR-08 | Payroll di-disburse Keuangan **setelah** melalui pipeline: Persiapan HRIS → Validasi Keuangan → Kalkulasi Pajak → Approval WR II → Disburse — tidak boleh melompati tahap |
| BR-09 | Data karyawan & struktur komisi CRM bersifat **read-only** di Keuangan — perubahan master data harus lewat modul asalnya (HRIS/CRM) |
| BR-10 | Jurnal otomatis dari sub-modul (penerimaan, payroll, PO) tidak bisa diedit langsung — koreksi hanya lewat **jurnal manual** dengan keterangan & approval |

## 7. Metrik Sukses

| Metrik | Target Indikatif |
|---|---|
| Collection Rate SPP/UKT per periode | Meningkat, dipantau via dashboard (mockup: 73%) |
| Rekonsiliasi otomatis Payment Gateway | 100% transaksi VA/QRIS/Kartu Kredit auto-match, minimal manual match untuk setoran non-PG |
| Ketepatan waktu pelaporan pajak (SPT Masa, e-Bupot) | 100% sebelum tanggal 20 bulan berikutnya |
| Ketepatan waktu disbursement payroll | Sesuai target pipeline (mis. tanggal 25 tiap bulan) |
| Akurasi status clearance ke SIAKAD/LMS | 100% sinkron real-time, tidak ada mahasiswa lunas yang masih terblokir atau sebaliknya |

## 8. Risiko Bisnis

| Risiko | Mitigasi |
|---|---|
| Kegagalan sinkron status clearance ke SIAKAD/LMS → mahasiswa lunas tapi masih terblokir ujian (atau sebaliknya) | Event idempotent + rekonsiliasi berkala + tombol "Force Re-sync" darurat |
| Rekonsiliasi Payment Gateway meleset (selisih bank) | Proses rekonsiliasi bank berkala dengan penandaan "belum match" untuk investigasi manual |
| Ketergantungan pada HRIS/CRM untuk data karyawan/komisi — data telat/salah sync | Read-only dgn indikator "sumber data: Modul HRIS/CRM" + tombol re-sync manual |
| Kesalahan kalkulasi pajak progresif merugikan karyawan/vendor | Validasi berlapis (Validasi Keuangan → Kalkulasi Pajak → Approval) sebelum disburse |
| Approval PO dilewati/dimanipulasi | Threshold approval berjenjang wajib by-system (bukan opsional), audit log lengkap |

## 9. Roadmap Ringkas

| Fase | Fokus |
|---|---|
| Fase 1 (MVP) | Penerimaan Mahasiswa (SPP/UKT) + Portal Mahasiswa (SKEUM): tagihan, bayar via PG, riwayat, e-kuitansi; status clearance dasar ke SIAKAD |
| Fase 2 | Beasiswa & Keringanan, Penerimaan PMB (sinkron funnel), Wisuda & Kegiatan |
| Fase 3 | Pengeluaran (Payroll disbursement, PO, Honor Eksternal, Komisi CRM), Data Karyawan read-only |
| Fase 4 | Pajak & Kepatuhan penuh, Akuntansi (CoA, Jurnal, RAB), Laporan Keuangan lengkap |
