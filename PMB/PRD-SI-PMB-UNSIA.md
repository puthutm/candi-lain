# Product Requirements Document (PRD)
## Sistem Informasi PMB — Universitas Siber Asia (UNSIA)

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 11 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL |
| Terkait | BRD-SI-PMB-UNSIA.md; terintegrasi dengan SSO Platform (BRD/PRD/ERD sebelumnya) untuk login staf |
| Sumber | Reverse-engineering mockup: `PMB_PUBLIK.html`, `DASHBOARD_PENDAFTARAN.html`, `ujiantesmasuk.html`, `ADMIN_PMB_2.html` |

---

## 1. Ringkasan Produk

SI-PMB UNSIA terdiri dari 4 aplikasi front-end yang berbagi satu basis data & backend:

1. **Portal Publik** (`/pmb`) — landing & pendaftaran untuk calon mahasiswa baru.
2. **Dashboard Pendaftar** (`/pmb/dashboard`) — portal pribadi pendaftar pasca-daftar.
3. **Ujian CBT** (`/pmb/ujian`) — modul ujian seleksi online.
4. **Admin PMB** (`/admin/pmb`) — back-office panitia, terintegrasi ke SSO Platform untuk login & role.

## 2. Problem Statement

Saat ini proses PMB (berdasarkan konteks mockup) memerlukan satu sistem terpadu yang menghubungkan pendaftaran → pembayaran → verifikasi berkas → ujian → keputusan penerimaan, dengan visibilitas funnel yang jelas bagi panitia agar dapat menekan drop-off dan mempercepat SLA proses.

## 3. Goals & Non-Goals

**Goals**
- Alur pendaftaran mandiri (self-service) dari sisi calon mahasiswa, dari awal sampai tahu hasil kelulusan.
- Panitia punya satu dashboard untuk memonitor & bertindak di setiap tahap funnel.
- Ujian seleksi dapat dilakukan online dengan integritas hasil yang terjaga (tidak bisa diulang sembarangan, tercatat waktu pengerjaan).
- Komunikasi ke calon mahasiswa terotomasi berbasis tahapan (trigger-based).

**Non-Goals (Fase 1)**
- Proses akademik pasca-penerimaan (SIAKAD, KRS, dsb).
- Pemilihan/penentuan provider payment gateway & WA/Email gateway final (ditentukan di tahap desain teknis terpisah).
- Modul `commandcenter.html` — di luar konteks PMB (lihat catatan di BRD).

## 4. User Roles / Personas

| Peran | Akses | Deskripsi |
|---|---|---|
| **Calon Mahasiswa (Pendaftar)** | Portal Publik + Dashboard Pendaftar + Ujian CBT | Mendaftar, bayar, isi berkas, ikut ujian |
| **Super Admin PMB** | Admin PMB — seluruh panel | Kelola gelombang/kuota, pengaturan sistem, melihat semua data |
| **Verifikator Berkas** | Admin PMB — panel Verifikasi & Pendaftar | Meninjau & memvalidasi dokumen |
| **Staff Keuangan** | Admin PMB — panel Pembayaran & Pendaftar | Rekonsiliasi transaksi, konfirmasi pembayaran manual |
| **Staff Marketing/Komunikasi** | Admin PMB — panel Komunikasi & Monitoring | Kelola kampanye, template pesan, lihat funnel |

> Role staff di atas persis mencerminkan **dynamic role per aplikasi** yang sudah dirancang di SSO Platform — "Admin PMB" didaftarkan sebagai satu `application`, dan role-role ini menjadi isi `application_roles` miliknya.

## 5. Functional Requirements

### FR-A. Portal PMB Publik

- FR-A.1 Landing page menampilkan info program studi, gelombang aktif, dan jalur masuk.
- FR-A.2 Wizard pendaftaran 4 langkah:
  1. **Gelombang** — pilih periode pendaftaran (status: aktif / belum dibuka / tertutup, dengan info kuota).
  2. **Jalur** — pilih jalur masuk (Reguler, Prestasi, Mitra, Beasiswa), masing-masing dengan biaya formulir berbeda (termasuk gratis).
  3. **Program Studi** — pilih program studi & fakultas.
  4. **Data Diri** — nama, email, no. HP, persetujuan syarat & ketentuan (checkbox wajib).
- FR-A.3 Validasi input real-time (nama, email, no. HP wajib & format valid) sebelum lanjut ke langkah berikutnya.
- FR-A.4 Setelah submit, sistem generate **nomor pendaftaran unik** dan menampilkan halaman sukses (dengan opsi salin nomor referensi).
- FR-A.5 Pendaftar yang sudah punya akun dapat login (modal login: email + password) langsung dari portal publik menuju Dashboard Pendaftar.
- FR-A.6 Sistem menampilkan status gelombang (aktif/tertutup/belum dibuka) secara dinamis berdasarkan konfigurasi panitia di Admin PMB.

### FR-B. Dashboard Pendaftar

- FR-B.1 Stepper visual alur seleksi 5 tahap: **Buat Akun → Bayar Tagihan → Data & Berkas → Ujian Mandiri → Hasil Akhir**, menunjukkan posisi pendaftar saat ini.
- FR-B.2 Halaman tagihan menampilkan daftar tagihan (mis. tagihan formulir, tagihan daftar ulang) dengan nomor invoice, jumlah, dan status.
- FR-B.3 Pendaftar memilih saluran pembayaran: Virtual Account (BCA, Mandiri, dst), QRIS, E-Wallet (OVO, Dana, dst), atau Transfer Bank.
- FR-B.4 Setelah metode dipilih, sistem menampilkan instruksi pembayaran sesuai metode terpilih.
- FR-B.5 Pendaftar melengkapi biodata & mengunggah berkas persyaratan (KTP, Ijazah/SKL, Rapor, Pas Foto, dan dokumen lain sesuai jalur/prodi).
- FR-B.6 Status setiap berkas ditampilkan (belum upload / menunggu verifikasi / terverifikasi / perlu revisi) beserta catatan revisi dari panitia bila ada.
- FR-B.7 Setelah seluruh syarat terpenuhi (bayar lunas + berkas terverifikasi), akses ke modul Ujian CBT terbuka otomatis.
- FR-B.8 Halaman Hasil Akhir menampilkan status kelulusan & instruksi lanjutan (mis. daftar ulang) setelah panitia memutuskan.

### FR-C. Sistem Ujian CBT

- FR-C.1 Daftar modul ujian ditampilkan sebagai kartu, masing-masing dengan status: belum dikerjakan / draf tersimpan / selesai dikumpulkan.
- FR-C.2 5 modul ujian standar (dapat dikonfigurasi jumlah/jenisnya oleh admin):

  | Modul | Durasi | Tipe |
  |---|---|---|
  | Tes Potensi Akademik (TPA) | 60 menit | Soal teks |
  | Pengetahuan Umum | 45 menit | Soal teks |
  | Kewarganegaraan (PKN) | 30 menit | Soal teks |
  | Bahasa Inggris | 60 menit | Soal teks |
  | Tes Buta Warna | 2 menit | Soal berbasis gambar |

- FR-C.3 Sebelum memulai modul, pendaftar melihat halaman **briefing** (judul modul, durasi, jumlah soal, instruksi) dan harus konfirmasi mulai.
- FR-C.4 Timer global per modul berjalan otomatis; sistem memberi peringatan waktu hampir habis dan auto-submit saat waktu habis.
- FR-C.5 Jawaban tersimpan otomatis secara berkala (auto-save) — mendukung fitur "Lanjutkan Draf" bila sesi terputus.
- FR-C.6 Daftar soal (navigasi soal) memudahkan pendaftar melompat antar nomor & melihat soal yang sudah/belum dijawab.
- FR-C.7 Setelah seluruh modul disubmit, sistem menampilkan halaman "Seluruh Ujian Selesai" dan status berpindah ke tahap **Selesai Ujian** di funnel.
- FR-C.8 Modul yang sudah "Selesai Dikumpulkan" tidak dapat dikerjakan ulang oleh pendaftar (kecuali panitia membuka ulang secara manual — kebijakan retake).

### FR-D. Admin PMB

**D.1 Beranda / Analitik**
- Ringkasan harian: jumlah pendaftar baru, sedang diproses, terverifikasi.
- Tren pendaftaran mingguan, top program studi, aktivitas terbaru, daftar tugas hari ini.

**D.2 Monitoring PMB (Funnel Konversi)**
- Visualisasi funnel 8 tahap (Peminat → Pendaftar → Isi Biodata → Unggah Berkas → Siap Ujian → Sedang Ujian → Selesai Ujian → Diterima) dengan angka & persentase konversi per tahap.
- Filter berdasarkan gelombang (per gelombang / semua gelombang).
- Analisis drop-off tertinggi & konversi terbaik antar-tahap, ditampilkan sebagai insight otomatis.

**D.3 Data Pendaftar**
- Tabel pendaftar dengan kolom: No. Pendaftaran, Nama/Kontak, Program Studi, Jalur, Status, Status Bayar, Aksi.
- Filter berdasarkan program studi dan status (Menunggu Bayar, Verifikasi Berkas, Lulus Seleksi, Revisi Berkas).
- Detail per pendaftar dapat dibuka (drawer/detail panel) untuk melihat seluruh riwayat & dokumen.

**D.4 Verifikasi Berkas**
- Workspace verifikasi dengan antrean (queue) pendaftar yang menunggu review, lengkap dengan indikator SLA (target & rata-rata waktu proses).
- Preview dokumen langsung di panel (tanpa unduh manual).
- Aksi: setujui (approve) atau minta revisi (dengan catatan wajib diisi) per dokumen.
- Notifikasi otomatis ke pendaftar saat status berkas berubah.

**D.5 Pembayaran**
- Tabel transaksi: Invoice, Pendaftar, Jumlah, Metode, Status, Tanggal.
- Rekonsiliasi transaksi (otomatis via webhook payment gateway, dengan opsi konfirmasi manual sebagai fallback).

**D.6 Komunikasi & Kampanye**
- **Template Pesan** aktif dengan trigger otomatis, contoh: Welcome Email (setelah submit pendaftaran), Payment Reminder (H-3 sebelum jatuh tempo), Acceptance Letter (setelah dinyatakan lulus).
- **Kampanye** — blast email/WhatsApp ke segmen tertentu (mis. leads yang belum daftar, pendaftar yang belum bayar), dengan penjadwalan dan metrik terkirim/dibuka/klik.
- **Otomasi (Workflow)** berbasis event, contoh:
  - Form Submitted → kirim Welcome Email
  - 3 hari tanpa bayar → kirim reminder email + SMS/WA
  - Payment Confirmed → kirim NIM + Acceptance Letter
  - 5 hari tanpa onboarding pasca-diterima → reminder onboarding

**D.7 Gelombang & Kuota**
- CRUD periode gelombang pendaftaran (nama, periode tanggal, status aktif/belum dibuka/tertutup).
- Pengaturan kuota per program studi per gelombang.
- Pengaturan jalur masuk & biaya formulir per jalur.

**D.8 Pengaturan**
- Konfigurasi umum sistem PMB (identitas instansi, syarat & ketentuan, template dokumen, dsb — detail lanjut perlu klarifikasi ke pemilik produk).
- Manajemen role & user staff PMB (terhubung ke SSO Platform — lihat bagian 7).

## 6. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Dokumen pendaftar (KTP, KK, dsb) disimpan terenkripsi; akses berbasis role; URL dokumen tidak dapat diakses publik tanpa otorisasi |
| Performa | Wizard pendaftaran & submit tagihan tetap responsif saat traffic tinggi mendekati deadline gelombang |
| Ketersediaan | Modul Ujian CBT harus tetap tersedia stabil selama jadwal ujian live berlangsung (banyak sesi paralel) |
| Auditability | Setiap perubahan status (verifikasi, pembayaran, kelulusan) tercatat lengkap dengan aktor & waktu |
| Reliabilitas Ujian | Auto-save jawaban berkala; sesi ujian dapat dilanjutkan (draft) jika koneksi terputus |
| Integrasi | Webhook payment gateway real-time; API WhatsApp/Email untuk komunikasi otomatis |
| Skalabilitas | Sistem harus dapat menangani lonjakan pendaftar mendekati batas akhir tiap gelombang |

## 7. Integrasi dengan SSO Platform

Staf/panitia PMB **tidak** memakai sistem login terpisah — "Admin PMB" didaftarkan sebagai satu `application` di SSO Platform:

- `applications`: 1 baris baru — client untuk Admin PMB.
- `application_roles` (dinamis, dibuat oleh App Owner PMB): `super_admin_pmb`, `verifikator_berkas`, `staff_keuangan`, `staff_marketing`.
- `user_application_roles`: assignment staf ke role tsb — menentukan panel mana yang bisa mereka akses (mis. Verifikator Berkas hanya melihat panel Verifikasi & Data Pendaftar).
- Login calon mahasiswa (pendaftar) **terpisah** dari SSO staf — pendaftar adalah entitas eksternal/publik, disarankan punya tabel `pmb_applicants` sendiri (bukan `users` milik SSO), agar tidak mencampur identitas staf internal dengan calon mahasiswa.

## 8. Alur Utama (User Journey Pendaftar)

1. Calon mahasiswa membuka Portal Publik → pilih Gelombang → Jalur → Program Studi → isi Data Diri → submit.
2. Sistem membuat akun pendaftar & nomor pendaftaran, mengirim Welcome Email otomatis.
3. Pendaftar login ke Dashboard Pendaftar → melihat tagihan formulir → memilih metode pembayaran → bayar.
4. Setelah pembayaran terkonfirmasi (via webhook), pendaftar melengkapi biodata & mengunggah berkas.
5. Panitia (Verifikator Berkas) meninjau dokumen dari antrean verifikasi → approve atau minta revisi.
6. Jika revisi diminta, pendaftar mendapat notifikasi & mengunggah ulang; jika disetujui, status pendaftar naik ke "Siap Ujian".
7. Pendaftar mengikuti Ujian CBT (5 modul) sesuai jadwal, dengan briefing & timer per modul.
8. Setelah seluruh modul disubmit, status menjadi "Selesai Ujian" → menunggu penilaian.
9. Panitia memutuskan kelulusan; sistem mengirim Acceptance Letter otomatis; pendaftar melihat Hasil Akhir di dashboard.

## 9. Kebutuhan Data (Ringkas)

Entitas inti yang perlu dirancang di skema database (detail ERD menyusul di tahap desain teknis):

- **Master**: `waves` (gelombang), `entry_paths` (jalur), `study_programs` (prodi), `quotas` (kuota per prodi per gelombang)
- **Pendaftar**: `applicants`, `applicant_documents`, `applicant_status_history`
- **Pembayaran**: `invoices`, `payment_transactions`
- **Ujian**: `exam_modules`, `exam_sessions`, `exam_answers`, `exam_results`
- **Komunikasi**: `message_templates`, `campaigns`, `automation_workflows`, `message_logs`
- **Funnel/Analitik**: turunan (derived) dari tabel di atas, tidak perlu tabel tersendiri — dihitung on-query atau via materialized view

## 10. Rencana Rilis (High-Level)

| Fase | Cakupan |
|---|---|
| Fase 1 (MVP) | Portal Publik + Dashboard Pendaftar (pendaftaran, tagihan, upload berkas) + Admin PMB dasar (Data Pendaftar, Verifikasi, Pembayaran) |
| Fase 2 | Sistem Ujian CBT lengkap, Monitoring Funnel, Gelombang & Kuota |
| Fase 3 | Komunikasi & Kampanye (otomasi + blast), integrasi SSO penuh untuk staf, analitik lanjutan |

## 11. Open Questions (perlu klarifikasi ke pemilik produk / bos)

- Payment gateway mana yang akan dipakai (Midtrans, Xendit, dll)? Ini menentukan desain integrasi pembayaran.
- Provider WhatsApp Business API untuk komunikasi & kampanye?
- Apakah pendaftar boleh mengulang (retake) modul ujian tertentu, dan dengan kebijakan apa?
- Apakah `commandcenter.html` benar-benar di luar scope PMB, atau ada keterkaitan (mis. sebaran asal daerah pendaftar) yang perlu digali ulang?
- Apakah dibutuhkan proses interview/wawancara sebagai tahap tambahan selain CBT untuk jalur tertentu (mis. Prestasi/Beasiswa)?
