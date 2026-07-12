# Catatan Arsitektur — Integrasi Microservices (ERP UNSIA)

> ⚠️ **Revisi dari `Catatan-Integrasi-Lintas-Sistem.md` sebelumnya.** Dokumen itu mengasumsikan satu PostgreSQL bersama dengan FK asli lintas sistem. Setelah dikonfirmasi arahnya **microservices**, pendekatan itu **dibatalkan** — FK lintas database justru melanggar prinsip *database-per-service* (tiap service tidak boleh baca/tulis langsung ke database service lain). Dokumen ini menggantikannya.

## Prinsip Dasar

Tiga service (**SSO**, **PMB**, **SIAKAD**) masing-masing:
- Punya **database sendiri**, tidak diakses langsung oleh service lain.
- Saling berkomunikasi **hanya lewat API** (sync, real-time) atau **event/webhook** (async, eventual consistency).
- Tidak ada `FOREIGN KEY ... REFERENCES other_service_table` — yang ada adalah **kolom UUID biasa** yang *secara konvensi* menyimpan ID dari service lain, divalidasi di level aplikasi (bukan constraint database).

## 3 Titik Integrasi — Pola per Kasus

### 1. Staf SSO memverifikasi berkas PMB / menilai ujian
- **Pola**: Setiap request ke PMB API membawa JWT (access token dari SSO). PMB **tidak query tabel `users` SSO** — ia baca klaim `sub` (user id), `name`, `role` langsung dari JWT yang sudah tervalidasi.
- Kolom `verified_by_user_id` di PMB tetap disimpan sebagai UUID biasa (bukan FK) — untuk keperluan audit, **simpan juga snapshot nama/email di saat itu** (`verified_by_name_snapshot`) supaya riwayat verifikasi tidak berubah kalau nama staf diubah kemudian di SSO.
- Kalau PMB butuh info staf lain di luar klaim token (mis. daftar semua verifikator aktif untuk dropdown), panggil `GET /api/users?ids=...` ke SSO secara eksplisit — dengan timeout & fallback (cache lokal atau tampilkan "Staf tidak ditemukan").

### 2. Pendaftar PMB "Diterima" → jadi Mahasiswa SIAKAD
- **Pola**: **Event-driven**, bukan query langsung.
- Saat status applicant di PMB berubah jadi "Diterima" + Daftar Ulang lunas, PMB **publish event** `applicant.accepted_and_paid` berisi **snapshot lengkap** data yang dibutuhkan SIAKAD (nama, biodata, dokumen relevan, prodi tujuan) — bukan cuma ID.
- SIAKAD men-*subscribe* event ini, membuat record `students` baru dengan **copy data** (bukan join real-time ke PMB), dan menyimpan `pmb_applicant_id` sekadar sebagai **nilai referensi** (untuk keperluan audit/telusur — "mahasiswa ini asalnya dari pendaftaran nomor X"), tanpa constraint FK.
- **Idempotency wajib**: event bisa terkirim >1 kali (at-least-once delivery) — SIAKAD harus cek `pmb_applicant_id` sudah pernah diproses sebelum bikin `students` baru.
- Kalau belum ada message broker (Kafka/RabbitMQ/SQS), **webhook HTTP sederhana** dari PMB ke endpoint SIAKAD sudah cukup untuk Fase 1 — asal ada retry + idempotency key. Upgrade ke event bus penuh bisa menyusul.

### 3. Login mahasiswa/dosen (`sso_username`)
- **Pola**: Standar OAuth2 — SIAKAD terdaftar sebagai `application` di SSO, sama seperti PMB.
- SIAKAD **tidak simpan password**, tidak query tabel `users` SSO langsung. Setiap login, SIAKAD terima `access_token`/`id_token` berisi `sub` (user id) + role.
- SIAKAD boleh punya **local cache read-only** (`users_cache`: id, name, email, last_synced_at) untuk mempercepat tampilan (hindari call SSO tiap render halaman) — di-refresh saat login, atau via webhook `user.updated` dari SSO kalau tersedia.

## Dampak ke ERD per Service

ERD per-sistem yang sudah dibuat (`ERD-SSO-Platform.mermaid`, `ERD-SI-PMB-UNSIA.mermaid`, `ERD-SIAKAD-UNSIA.mermaid`) **tetap berlaku seperti semula** — kolom-kolom yang tadinya saya tulis dengan komentar `"ref SSO users.id"` itu **sudah benar** untuk microservices (UUID biasa, bukan FK). Yang **dibatalkan** adalah file `ERD-Integrasi-Lintas-Sistem.mermaid` yang menggambarkan FK asli — silakan anggap file itu tidak berlaku lagi.

Sebagai gantinya, lihat `Arsitektur-Microservices-ERP-UNSIA.mermaid` — diagram arsitektur service, bukan ERD — yang menunjukkan bagaimana ketiga service saling terhubung lewat API & event, termasuk validasi token terpusat lewat SSO.

## Implikasi ke Rencana Implementasi (Plan)

| Area | Implikasi |
|---|---|
| **Kontrak API** | Setiap service perlu definisi API kontrak (OpenAPI/Swagger) disepakati **sebelum** Sprint 0 masing-masing tim mulai — supaya tidak saling menunggu implementasi selesai duluan |
| **Auth service-to-service** | PMB & SIAKAD perlu implementasi validasi JWT (via JWKS SSO) sebagai middleware — bukan sekadar "asumsi sudah login" |
| **Event/webhook** | Perlu keputusan teknis: webhook HTTP sederhana (cepat, cukup utk Fase 1) vs message broker (lebih robust, tapi nambah infra) — rekomendasi: **mulai webhook dulu**, upgrade kalau volume/reliability jadi masalah |
| **Idempotency** | Wajib didesain sejak awal di consumer event (SIAKAD), bukan ditambal belakangan |
| **Independent deploy** | Ketiga service **boleh** dikembangkan & di-deploy oleh tim berbeda dengan kecepatan berbeda — ini keuntungan utama microservices dibanding shared-DB kemarin |
| **Data terduplikasi = normal** | Nama/email mahasiswa akan "ada di dua tempat" (SSO & SIAKAD) — ini **bukan bug**, ini konsekuensi wajar microservices. Yang penting ada mekanisme sinkronisasi (event) saat sumber datanya berubah |

## Rekomendasi Selanjutnya

1. Update `Plan-SSO-Platform.md`, `Plan-SI-PMB-UNSIA.md`, `Plan-SIAKAD-UNSIA.md` — tambahkan task "Desain API Contract" di Sprint 0 masing-masing, dan task implementasi webhook/event di titik integrasi terkait (PMB Epic terkait onboarding, SIAKAD Epic A5).
2. Pertimbangkan API Gateway (opsional tapi direkomendasikan) supaya client tidak perlu tahu alamat masing-masing service, dan validasi token bisa dipusatkan.
3. Buat 1 dokumen kecil "API Contract Registry" (daftar endpoint + payload event) begitu tiap service mulai stabil — supaya tim lain tidak menebak-nebak struktur data.
