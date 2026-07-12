# Business Requirements Document (BRD)
## Sistem Informasi PMB — Universitas Siber Asia (UNSIA)

| Metadata | Keterangan |
|---|---|
| Nama Sistem | Sistem Informasi Penerimaan Mahasiswa Baru (SI-PMB) UNSIA |
| Versi Dokumen | 1.0 |
| Tanggal | 11 Juli 2026 |
| Status | Draft — disusun berdasarkan reverse-engineering mockup UI yang diberikan |
| Sumber Analisis | `PMB_PUBLIK.html`, `DASHBOARD_PENDAFTARAN.html`, `ujiantesmasuk.html`, `ADMIN_PMB.html`, `ADMIN_PMB_2.html` |
| Catatan | `commandcenter.html` (dashboard peta nasional desa/wilayah) tidak termasuk analisis ini karena secara konten tidak berkaitan dengan PMB — lihat bagian 8 (Asumsi) |

---

## 1. Latar Belakang

Manajemen UNSIA telah menyiapkan rancangan tampilan (mockup/prototype) untuk empat sub-sistem yang saling terhubung dalam satu alur Penerimaan Mahasiswa Baru:

1. **Portal PMB Publik** — landing page pendaftaran untuk calon mahasiswa baru.
2. **Dashboard Pendaftar** — portal pribadi bagi calon mahasiswa yang sudah mendaftar, untuk memantau status, membayar tagihan, dan melengkapi berkas.
3. **Sistem Ujian CBT** — modul ujian seleksi masuk berbasis komputer.
4. **Admin PMB** — back-office bagi panitia PMB untuk mengelola seluruh proses, mulai dari monitoring, verifikasi berkas, pembayaran, hingga komunikasi/kampanye ke calon mahasiswa.

Dokumen ini menerjemahkan mockup tersebut menjadi kebutuhan bisnis formal, sebagai dasar pengembangan sistem sesungguhnya (Next.js + Drizzle + PostgreSQL, terintegrasi dengan SSO Platform yang sudah dirancang sebelumnya untuk otentikasi staf).

## 2. Tujuan Bisnis

- **BO-01**: Mendigitalkan seluruh proses PMB dari leads/peminat hingga mahasiswa diterima, tanpa proses manual/offline.
- **BO-02**: Meningkatkan konversi pendaftar menjadi mahasiswa diterima (funnel saat ini menunjukkan konversi akhir ±16,4% dari total peminat).
- **BO-03**: Mempercepat proses verifikasi berkas (target SLA verifikasi berkas ≤ 2 jam per pendaftar).
- **BO-04**: Memberikan visibilitas real-time ke pimpinan mengenai performa tiap gelombang/jalur/program studi.
- **BO-05**: Mengotomasi komunikasi (email/WhatsApp) ke calon mahasiswa di setiap tahapan agar mengurangi drop-off.
- **BO-06**: Menyediakan proses ujian seleksi mandiri (CBT) yang aman, terjadwal, dan dapat diaudit.

## 3. Ruang Lingkup (Scope)

### 3.1 Termasuk dalam scope

| Sub-sistem | Cakupan |
|---|---|
| Portal PMB Publik | Landing page, wizard pendaftaran 4 langkah (Gelombang → Jalur → Program Studi → Data Diri), validasi input, generate nomor pendaftaran, login untuk pendaftar existing |
| Dashboard Pendaftar | Stepper alur seleksi 5 tahap, tagihan & pembayaran multi-metode, upload biodata & berkas, akses ke modul ujian |
| Sistem Ujian CBT | 5 modul ujian (Tes Potensi Akademik, Pengetahuan Umum, Kewarganegaraan, Bahasa Inggris, Tes Buta Warna), timer per modul, briefing sebelum ujian, submission per modul |
| Admin PMB | Beranda analitik, Monitoring Funnel Konversi, Data Pendaftar, Verifikasi Berkas (workspace + SLA), Pembayaran, Komunikasi & Kampanye, Gelombang & Kuota, Pengaturan |

### 3.2 Tidak termasuk dalam scope (Fase 1)

- Integrasi ke Sistem Informasi Akademik (SIAKAD) pasca-mahasiswa diterima (mis. pembuatan NIM final, penjadwalan kelas) — hanya penerbitan status "Diterima" & data dasar.
- Payment gateway & WhatsApp/Email gateway pihak ketiga spesifik — dibahas sebagai kebutuhan integrasi, provider ditentukan di fase teknis.
- Modul `commandcenter.html` (dashboard peta nasional) — di luar konteks PMB, perlu konfirmasi terpisah dari pemberi mockup.

## 4. Proses Bisnis End-to-End (Funnel PMB)

Berdasarkan mockup Monitoring Funnel di Admin PMB, alur konversi calon mahasiswa terdiri dari 8 tahap:

| # | Tahap | Deskripsi |
|---|---|---|
| 1 | Peminat (Leads) | Pengunjung halaman PMB publik |
| 2 | Pendaftar | Berhasil submit wizard pendaftaran (dapat nomor pendaftaran) |
| 3 | Isi Biodata | Melengkapi data diri di Dashboard Pendaftar |
| 4 | Unggah Berkas | Upload dokumen persyaratan (KTP, Ijazah/SKL, Rapor, Pas Foto, dst) |
| 5 | Siap Ujian (CBT) | Berkas terverifikasi, pembayaran lunas, memenuhi syarat ikut ujian |
| 6 | Sedang Ujian | Status live saat pendaftar mengerjakan modul CBT |
| 7 | Selesai Ujian | Seluruh modul CBT sudah disubmit, menunggu penilaian |
| 8 | Diterima | Lulus seleksi, menjadi mahasiswa baru |

Titik drop-off terbesar (berdasarkan data mockup) terjadi antara tahap **4 → 5 (Unggah Berkas → Siap Ujian)**, dengan indikasi calon mahasiswa tidak melanjutkan setelah upload berkas — ini adalah target utama perbaikan proses (mis. reminder otomatis).

## 5. Stakeholder

| Peran | Kepentingan |
|---|---|
| Calon Mahasiswa / Pendaftar | Mendaftar, membayar, melengkapi berkas, mengikuti ujian dengan mudah |
| Panitia PMB — Verifikator Berkas | Meninjau & memvalidasi dokumen pendaftar secara cepat |
| Panitia PMB — Keuangan | Memantau & merekonsiliasi transaksi pembayaran |
| Panitia PMB — Marketing/Komunikasi | Mengelola kampanye & komunikasi otomatis ke calon mahasiswa |
| Kepala/Ketua PMB (Super Admin) | Monitoring performa keseluruhan, mengatur gelombang & kuota |
| Tim IT | Mengelola konfigurasi sistem, integrasi, keamanan |

## 6. Kebutuhan Bisnis (Business Requirements)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| BR-01 | Calon mahasiswa dapat mendaftar secara mandiri melalui portal publik tanpa bantuan panitia | Must Have |
| BR-02 | Sistem mendukung multi-gelombang pendaftaran dengan status berbeda (aktif/belum dibuka/tertutup) dan kuota per program studi | Must Have |
| BR-03 | Sistem mendukung multi-jalur masuk dengan biaya pendaftaran berbeda-beda (termasuk jalur gratis/beasiswa) | Must Have |
| BR-04 | Pendaftar dapat memantau progres seleksinya sendiri secara real-time (stepper status) | Must Have |
| BR-05 | Pendaftar dapat membayar tagihan melalui berbagai metode (Virtual Account, QRIS, e-wallet, transfer bank) | Must Have |
| BR-06 | Panitia dapat memverifikasi/menolak berkas pendaftar dengan catatan revisi, dan pendaftar menerima notifikasi otomatis | Must Have |
| BR-07 | Pendaftar yang lolos verifikasi & pembayaran dapat mengikuti ujian seleksi (CBT) sesuai jadwal | Must Have |
| BR-08 | Ujian CBT harus mencatat waktu mulai/selesai per modul dan tidak dapat diulang setelah disubmit (kecuali kebijakan lain ditentukan) | Must Have |
| BR-09 | Panitia memiliki visibilitas funnel konversi per tahap, per gelombang, dan analisis drop-off | Must Have |
| BR-10 | Sistem dapat mengirim komunikasi otomatis (email/WhatsApp) berbasis trigger tahapan (welcome, reminder bayar, hasil kelulusan, dst) | Should Have |
| BR-11 | Panitia dapat membuat kampanye komunikasi massal (blast) dengan target segmentasi tertentu | Should Have |
| BR-12 | Seluruh aktivitas verifikasi, perubahan status, dan transaksi tercatat untuk kebutuhan audit | Must Have |
| BR-13 | Panitia PMB (staf internal) login menggunakan akun terpusat dengan role sesuai fungsinya (verifikator, keuangan, marketing, admin) | Should Have — terhubung ke SSO Platform |
| BR-14 | Sistem menampilkan SLA proses verifikasi berkas dan rata-rata waktu pemrosesan sebagai metrik kinerja panitia | Should Have |
| BR-15 | Pendaftar existing dapat login kembali ke dashboard menggunakan email/nomor pendaftaran + password | Must Have |

## 7. Metrik Keberhasilan (Success Metrics)

- Konversi akhir (Peminat → Diterima) meningkat dari baseline funnel yang ada.
- Drop-off pada tahap Unggah Berkas → Siap Ujian berkurang signifikan setelah reminder otomatis diaktifkan.
- SLA verifikasi berkas rata-rata ≤ 2 jam per dokumen (sesuai target di mockup).
- 100% transaksi pembayaran terekonsiliasi otomatis tanpa input manual panitia.
- Zero data pendaftar hilang/tidak tercatat selama periode pendaftaran (termasuk saat traffic tinggi mendekati batas akhir gelombang).

## 8. Asumsi

- `commandcenter.html` **di luar scope** dokumen ini karena tidak berkaitan dengan proses PMB; jika ternyata dibutuhkan (mis. sebagai dashboard sebaran asal daerah pendaftar), akan dianalisis & didokumentasikan terpisah.
- `ADMIN_PMB_2.html` dianggap sebagai revisi terbaru/final dari `ADMIN_PMB.html` (struktur navigasi & panel identik: Beranda, Monitoring, Pendaftar, Verifikasi, Pembayaran, Komunikasi, Gelombang & Kuota, Pengaturan).
- Payment gateway dan penyedia WhatsApp/Email API akan ditentukan pada fase desain teknis (bukan bagian dari BRD ini).
- Login staf/panitia PMB akan memanfaatkan SSO Platform yang sudah dirancang, dengan `applications` baru bernama "Admin PMB" dan role dinamis (Verifikator Berkas, Staff Keuangan, Staff Marketing, Super Admin PMB) sesuai arsitektur dynamic role per aplikasi.

## 9. Batasan (Constraints)

- Tech stack mengikuti proyek existing: Next.js (fullstack), Drizzle ORM, PostgreSQL.
- Periode pendaftaran bersifat musiman dengan lonjakan traffic mendekati batas akhir gelombang — sistem harus tahan terhadap beban puncak.
- Ujian CBT harus tetap dapat diakses meskipun banyak pendaftar mengerjakan secara bersamaan pada jadwal yang sama ("Sedang Ujian: 120 sesi" pada contoh mockup).

## 10. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kegagalan sistem saat traffic tinggi mendekati deadline gelombang | Tinggi | Load testing, auto-scaling, antrian/caching pada endpoint pendaftaran |
| Data pribadi calon mahasiswa (KTP, KK, dsb) bocor | Tinggi | Enkripsi berkas, akses berbasis role, audit log akses dokumen |
| Ujian CBT terhenti di tengah jalan (koneksi putus) | Tinggi | Auto-save jawaban berkala, fitur "Lanjutkan Draf" (sudah terlihat di mockup) |
| Kesalahan verifikasi manual berkas oleh panitia | Sedang | Checklist standar verifikasi, dual-review untuk kasus tertentu |
| Rekonsiliasi pembayaran tidak sinkron dengan payment gateway | Sedang | Webhook otomatis + rekonsiliasi berkala terjadwal |

## 11. Ketergantungan (Dependencies)

- SSO Platform (fondasi identity untuk login staf/panitia dengan role dinamis).
- Payment gateway pihak ketiga (VA, QRIS, e-wallet, retail).
- Penyedia API WhatsApp Business & Email (untuk komunikasi otomatis & kampanye).
- Infrastruktur penyimpanan berkas (object storage) untuk dokumen pendaftar.
