# Business Requirements Document (BRD)
## HRIS — Human Resources Information System, Universitas Siber Asia (UNSIA)

| Metadata | Keterangan |
|---|---|
| Nama Sistem | HRIS UNSIA (Sistem Informasi SDM & Payroll) |
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Status | Draft — reverse-engineering mockup |
| Sumber Analisis | `HRIS.html` (Admin SDM, 14 panel), `SDM_Admins.html` (dashboard eksekutif + onboarding + sinkronisasi PDDikti/SISTER) |
| Terkait | SSO Platform (login staf), SIAKAD (data BKD & jadwal dosen), Sistem Keuangan (disbursement payroll) |

---

## 1. Latar Belakang

UNSIA memiliki dua populasi pegawai dengan kebutuhan administrasi berbeda: **Dosen** (tetap & tidak tetap, dengan kewajiban Beban Kerja Dosen/BKD dan sertifikasi Serdos yang diatur & dipantau negara via PDDikti/SISTER) dan **Tenaga Kependidikan/Tendik**. Saat ini rancangan mockup menunjukkan kebutuhan satu sistem SDM terpadu yang menangani **seluruh siklus hidup pegawai** — dari onboarding, presensi, cuti, penilaian kinerja, mutasi/promosi, hingga **payroll & pelaporan pajak** — sekaligus menjadi jembatan data ke SIAKAD (akademik) dan Sistem Keuangan (pembukuan & disbursement).

## 2. Tujuan Bisnis

- **BO-01**: Menyatukan data kepegawaian Dosen & Tendik dalam satu direktori (saat ini terlihat 247 pegawai: 142 Dosen, 105 Tendik, di 8 unit).
- **BO-02**: Mengotomasi proses payroll bulanan end-to-end — dari validasi absensi/BKD hingga disbursement — dengan tahapan yang dapat dipantau (run status).
- **BO-03**: Memastikan kepatuhan pajak (PPh21) dan BPJS terhitung otomatis & dapat dilaporkan (e-Bupot, penyetoran DJP).
- **BO-04**: Mendukung kewajiban pelaporan dosen ke sistem nasional (PDDikti, SISTER, portofolio BIMA) tanpa entri data ganda.
- **BO-05**: Menstandardisasi proses mutasi, promosi jabatan, dan kenaikan pangkat dengan alur persetujuan & SK yang terlacak.
- **BO-06**: Menyediakan penilaian kinerja terstruktur (SKP Tendik, Penilaian Dosen, Survei 360°) sebagai dasar objektif keputusan SDM.
- **BO-07**: Mengelola pelatihan & sertifikasi pegawai termasuk pengingat perpanjangan sebelum kadaluarsa.

## 3. Ruang Lingkup (Scope)

### 3.1 Termasuk dalam scope

| Modul | Cakupan |
|---|---|
| Direktori Pegawai (Karyawan) | Master data Dosen/Tendik, filter unit/tipe/status, profil biodata mendalam, rekening payroll |
| Onboarding | Checklist kelengkapan data pegawai baru (progres persentase) sebelum masuk ke direktori aktif |
| Presensi | Rekap kehadiran harian (Hadir/Telat/WFH/Cuti/Alpha), rata-rata jam kerja |
| Cuti & Lembur | Pengajuan, inbox persetujuan, saldo cuti, master jenis cuti (Tahunan/Sakit/Izin/Dinas Luar/Lembur/Cuti Besar) |
| Struktur & Jabatan | Struktur organisasi, master jabatan dengan tunjangan fungsional per golongan/pangkat |
| Mutasi & Promosi | SK Mutasi antar unit/fakultas, promosi jabatan fungsional/struktural, syarat angka kredit, alur persetujuan & SK |
| Payroll | Run penggajian bulanan bertahap (Persiapan → Validasi → Kalkulasi → Persetujuan → Disburse) |
| Slip Gaji | Generate, cetak, kirim email, distribusi massal slip gaji |
| Komponen Gaji | Master komponen Pendapatan/Potongan/Tunjangan/Sertifikasi/Skema Khusus, kena-pajak atau tidak |
| Pajak & BPJS | Kalkulasi PPh21 per bracket, e-Bupot, iuran BPJS Kesehatan/Ketenagakerjaan, riwayat penyetoran DJP |
| BKD Dosen | Beban Kerja Dosen 4 komponen (P&P, Penelitian, Pengabdian, Penunjang), Total SKS, status Serdos |
| SKP / Penilaian Kinerja | SKP Tendik, Penilaian Dosen, Survei 360°, skor Sasaran (60%) + Perilaku (40%) → Nilai Akhir & Predikat |
| Pelatihan & Sertifikasi | Kalender program, pendaftaran, sertifikat aktif & reminder kadaluarsa |
| Laporan | Pusat pelaporan (komposisi pegawai, turnover, rekap payroll, rekap absensi, rekap BKD, dst.) |
| Pengaturan | Profil institusi, kalender & hari libur, parameter payroll, user & hak akses, integrasi sistem, audit log, notifikasi |

### 3.2 Tidak termasuk dalam scope (Fase 1)

- Rekrutmen penuh (posting lowongan, seleksi kandidat) — mockup hanya menunjukkan titik masuk *onboarding pegawai baru yang sudah diterima*, bukan proses rekrutmen dari awal.
- Implementasi teknis integrasi PDDikti/SISTER/BIMA (kredensial & format pertukaran data pihak Kemendikbudristek) — dibahas sebagai kebutuhan integrasi, detail teknis di fase desain.
- Modul e-Bupot & pelaporan DJP secara penuh (submit otomatis ke sistem pajak negara) — Fase 1 cukup kalkulasi & rekap, penyetoran tetap dapat dilakukan manual/semi-otomatis.

## 4. Proses Bisnis Utama

### 4.1 Siklus Hidup Pegawai

Onboarding (checklist kelengkapan) → Aktif (masuk direktori, presensi/cuti/SKP berjalan) → Mutasi/Promosi (jika ada) → Non-Aktif/Pensiun (offboarding).

### 4.2 Siklus Payroll Bulanan (5 Tahap)

| # | Tahap | Deskripsi |
|---|---|---|
| 1 | Persiapan Data Master | Validasi master karyawan, komponen gaji, parameter pajak — tentukan karyawan eligible |
| 2 | Validasi Absensi & BKD | Tarik data absensi & BKD dosen dari **SIAKAD**, koreksi anomali |
| 3 | Kalkulasi Gross & Net | Hitung pendapatan, potongan BPJS, PPh21; item tertentu (mis. tunjangan kehadiran) butuh review manual |
| 4 | Persetujuan | Approval berjenjang sebelum disburse |
| 5 | Disburse & Slip | Pencairan ke rekening pegawai (via **Sistem Keuangan**) + distribusi slip gaji |

## 5. Stakeholder

| Peran | Kepentingan |
|---|---|
| Dosen & Tendik (Pegawai) | Lihat slip gaji, ajukan cuti, lihat BKD/SKP, akses pelatihan |
| Staff Biro SDM — Admin Data | Kelola direktori pegawai, onboarding, mutasi |
| Staff Biro SDM — Payroll & Pajak | Jalankan run payroll, kalkulasi pajak/BPJS, distribusi slip |
| Atasan Langsung / Kaprodi / Kabiro | Approve cuti, approve SKP, approve SK mutasi/promosi |
| Kepala Biro SDM (Super Admin) | Monitoring keseluruhan, approval final, pengaturan sistem |
| Kepala Prodi/Fakultas | Approve BKD dosen, penilaian kinerja dosen |
| Bagian Keuangan | Menerima instruksi disbursement, rekonsiliasi jurnal payroll |

## 6. Kebutuhan Bisnis (Business Requirements)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| BR-01 | Sistem menyimpan direktori pegawai terpadu (Dosen & Tendik) dengan filter unit/tipe/status | Must Have |
| BR-02 | Pegawai baru melalui proses onboarding dengan checklist kelengkapan data sebelum aktif penuh | Must Have |
| BR-03 | Presensi harian tercatat otomatis dan direkap per status (Hadir/Telat/WFH/Cuti/Alpha) | Must Have |
| BR-04 | Pegawai dapat mengajukan cuti/lembur secara mandiri; atasan menyetujui via inbox terpusat; saldo cuti terpantau | Must Have |
| BR-05 | Struktur jabatan & tunjangan fungsional terdata sebagai master, menjadi rujukan perhitungan gaji | Must Have |
| BR-06 | Proses mutasi & promosi memiliki alur persetujuan berjenjang dan menghasilkan SK terdokumentasi, dengan validasi syarat (mis. angka kredit minimum) | Must Have |
| BR-07 | Payroll dijalankan sebagai proses bertahap yang dapat dipantau statusnya (bukan proses satu langkah) | Must Have |
| BR-08 | Data absensi & BKD dosen ditarik otomatis dari SIAKAD sebagai bagian validasi payroll, dengan mekanisme koreksi anomali | Must Have |
| BR-09 | PPh21 dan iuran BPJS dihitung otomatis per pegawai berdasarkan komponen gaji & bracket pajak berlaku | Must Have |
| BR-10 | Slip gaji dapat dicetak, dikirim email, atau didistribusi massal ke seluruh pegawai eligible | Must Have |
| BR-11 | Beban Kerja Dosen (BKD) dicatat per 4 komponen (Pendidikan&Pengajaran, Penelitian, Pengabdian, Penunjang) dan dikaitkan dengan status Serdos | Must Have |
| BR-12 | Penilaian kinerja pegawai (SKP Tendik dengan skor Sasaran 60% + Perilaku 40%, Penilaian Dosen, Survei 360°) menghasilkan Nilai Akhir & Predikat yang terdokumentasi | Must Have |
| BR-13 | Sistem memantau sertifikat/pelatihan pegawai dan memberi peringatan sebelum kadaluarsa | Should Have |
| BR-14 | Tersedia laporan standar (komposisi pegawai, turnover, rekap payroll, rekap absensi, rekap BKD) yang dapat diunduh | Should Have |
| BR-15 | Data dosen (BKD, portofolio) dapat disinkronkan/didorong ke sistem nasional (PDDikti/SISTER/BIMA) tanpa entri ulang manual | Should Have |
| BR-16 | Disbursement payroll terhubung ke Sistem Keuangan untuk pencairan & pencatatan jurnal akuntansi | Must Have — terintegrasi ERP |
| BR-17 | Staf SDM login menggunakan akun terpusat (SSO) dengan role sesuai fungsinya (Admin Data, Payroll, Super Admin) | Should Have — terhubung ke SSO Platform |
| BR-18 | Seluruh perubahan data kepegawaian, approval, dan proses payroll tercatat untuk kebutuhan audit | Must Have |

## 7. Metrik Keberhasilan (Success Metrics)

- Payroll bulanan selesai tepat waktu sesuai target disburse (berdasarkan mockup: cutoff absensi H-7, disburse H+7 dari cutoff).
- Anomali validasi absensi/BKD terkoreksi sebelum tahap kalkulasi (target: 100% terselesaikan sebelum lanjut ke tahap berikutnya).
- Tingkat kehadiran termonitor real-time dengan akurasi tinggi (baseline mockup: 96,4%).
- 100% sertifikat dosen yang akan kadaluarsa dalam 6 bulan mendapat reminder otomatis.
- Zero selisih data BKD antara HRIS dan SIAKAD (sumber data sinkron).
- SKP/penilaian kinerja seluruh pegawai terselesaikan sebelum tenggat periode penilaian (baseline mockup: 87/105 tendik, 82,9%).

## 8. Asumsi

- `HRIS.html` dianggap sebagai sistem utama (comprehensive, 14 panel operasional); `SDM_Admins.html` dianggap sebagai varian dashboard eksekutif/onboarding yang melengkapi (Progres Onboarding, Sinkronisasi PDDikti, Direktori & Profil Mendalam) — kemungkinan tampilan ringkas untuk pimpinan atau titik masuk proses onboarding sebelum data masuk ke `HRIS.html` penuh.
- Login staf SDM memanfaatkan SSO Platform yang sudah dirancang, dengan `applications` baru "HRIS" dan role dinamis (Admin Data SDM, Admin Payroll, Atasan/Approver, Super Admin SDM).
- Integrasi ke SIAKAD (BKD & jadwal dosen) dan Sistem Keuangan (disbursement) mengikuti pola arsitektur microservices ERP UNSIA yang sudah ditetapkan (lihat `Catatan-Arsitektur-Microservices.md`) — event/webhook, bukan FK lintas database.
- Integrasi PDDikti/SISTER/BIMA bersifat satu arah dorong-data (push) dari HRIS, formatnya mengikuti spesifikasi resmi Kemendikbudristek yang perlu dikonfirmasi terpisah pada fase teknis.

## 9. Batasan (Constraints)

- Tech stack mengikuti ekosistem ERP existing: Next.js (fullstack), Drizzle ORM, PostgreSQL, database privat per service (microservices).
- Perhitungan PPh21 & BPJS harus mengikuti regulasi pemerintah yang dapat berubah tiap tahun (bracket pajak, tarif iuran) — parameter harus dapat dikonfigurasi, tidak boleh hardcode.
- Proses payroll bulanan bersifat time-sensitive (cutoff & target disburse tetap) — keterlambatan berdampak langsung ke seluruh pegawai.

## 10. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data BKD/absensi dari SIAKAD terlambat/gagal sync menjelang cutoff payroll | Tinggi | Buffer waktu antara cutoff SIAKAD dan cutoff payroll; opsi input manual darurat dengan approval khusus |
| Kesalahan kalkulasi PPh21/BPJS akibat parameter pajak usang | Tinggi | Parameter pajak dikelola sebagai master data bertanggal-berlaku, wajib direview tiap awal tahun pajak |
| Data gaji & rekening bank bocor | Tinggi | Enkripsi data sensitif, akses berbasis role ketat, audit log akses data payroll |
| SK Mutasi/Promosi diproses tanpa validasi syarat (mis. angka kredit belum cukup) | Sedang | Validasi otomatis syarat minimum sebelum SK dapat diajukan ke approval |
| Sertifikat Serdos/dosen kadaluarsa tanpa terdeteksi, berdampak ke tunjangan | Sedang | Reminder otomatis berjenjang (H-180, H-90, H-30) |
| Duplikasi/inkonsistensi data pegawai antara `HRIS.html` (operasional) dan `SDM_Admins.html` (eksekutif/onboarding) jika keduanya jadi sistem terpisah | Sedang | Pastikan satu sumber data (`hris_db`) — kedua tampilan adalah UI berbeda di atas data yang sama, bukan dua database |

## 11. Ketergantungan (Dependencies)

- SSO Platform (login staf SDM dengan role dinamis).
- SIAKAD (sumber data BKD & jadwal mengajar dosen, read-only bagi HRIS).
- Sistem Keuangan (penerima instruksi disbursement payroll & jurnal akuntansi).
- Sistem nasional Kemendikbudristek: PDDikti, SISTER, portofolio BIMA (integrasi pelaporan dosen).
- Provider email/notifikasi (distribusi slip gaji & reminder sertifikat).
