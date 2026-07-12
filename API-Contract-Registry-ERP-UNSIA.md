# API Contract Registry — Integrasi ERP UNSIA

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Status | Draft — mengikuti keputusan arsitektur di `Catatan-Arsitektur-Microservices.md` (database-per-service, komunikasi via API + event/webhook) |
| Terkait | `Arsitektur-Microservices-ERP-UNSIA.mermaid`, `Catatan-Arsitektur-Microservices.md`, BRD/PRD masing-masing service |
| Cakupan | 4 service: **SSO Platform**, **SI-PMB**, **LMS ICEMS**, **SIAKAD** (SIAKAD didokumentasikan sejauh yang sudah dirujuk lintas dokumen — BRD/PRD/ERD SIAKAD tersendiri menyusul) |

---

## 1. Prinsip Kontrak

Mengikuti `Catatan-Arsitektur-Microservices.md`:

- Tidak ada `FOREIGN KEY` lintas database. Semua ID lintas service adalah **UUID biasa**, divalidasi di level aplikasi.
- Komunikasi **sinkron** (API call) dipakai saat pemanggil butuh jawaban langsung untuk melanjutkan alur (mis. validasi token, ambil daftar staf).
- Komunikasi **asinkron** (webhook/event) dipakai saat perubahan status di satu service perlu **memicu** proses di service lain, tanpa pemanggil harus menunggu (mis. PMB→SIAKAD saat pendaftar diterima).
- Semua webhook/event **wajib idempotent** di sisi consumer (delivery bisa >1 kali).
- Field yang membawa data staf/user (mis. `verified_by_user_id`) selalu diiringi **snapshot nama** pada momen kejadian, supaya riwayat tidak berubah kalau data staf di SSO berubah belakangan.

---

## 2. Autentikasi Antar Service

| Jenis Panggilan | Mekanisme |
|---|---|
| Klien (browser) → service manapun | `access_token` (JWT) dari SSO, divalidasi tiap service via JWKS SSO (`GET /.well-known/jwks.json`) — **tidak** query tabel `users` SSO |
| Service → Service (server-to-server) | OAuth2 Client Credentials Grant — tiap service terdaftar sebagai `application` di SSO dengan scope terbatas (mis. `siakad:read`) |
| Provider eksternal → service (webhook masuk) | Signature verification (HMAC) sesuai dokumentasi provider (payment gateway, WA API) — bukan token SSO |

---

## 3. Endpoint API Sinkron (Request/Response)

### 3.1 SSO Platform (penyedia)

| Endpoint | Method | Dipanggil oleh | Guna |
|---|---|---|---|
| `/.well-known/jwks.json` | GET | PMB, LMS, SIAKAD | Validasi signature JWT |
| `/oauth/introspect` | POST | Semua service (fallback bila JWT perlu dicek real-time, mis. cek revoked) | Cek validitas token |
| `/api/users?ids=...` | GET | PMB, LMS, SIAKAD | Ambil detail staf di luar klaim token (mis. daftar verifikator aktif untuk dropdown) |
| `/oauth/token` (client_credentials) | POST | PMB, LMS, SIAKAD | Dapatkan token service-to-service |

### 3.2 SIAKAD (penyedia, dikonsumsi PMB & LMS)

| Endpoint | Method | Dipanggil oleh | Guna |
|---|---|---|---|
| `/api/academic-periods?status=berjalan` | GET | LMS | Ambil periode akademik aktif |
| `/api/classes?period_id=...` | GET | LMS | Ambil MK & dosen pengampu hasil plotting |
| `/api/krs-items?status=disetujui&period_id=...` | GET | LMS | Ambil peserta kelas dari KRS disetujui |
| `/api/students/ipk?ids=...` | GET | LMS | Ambil IPK terkini untuk pembentukan kelompok berbasis IPK (tidak disimpan lokal di LMS) |

> Semua endpoint SIAKAD di atas bersifat **read-only** bagi pemanggilnya — LMS/PMB tidak pernah menulis balik ke `siakad_db`.

### 3.3 Payment Gateway (eksternal, dikonsumsi PMB)

| Endpoint (pihak gateway) | Method | Guna |
|---|---|---|
| `POST /v1/invoices` (nama endpoint indikatif — final sesuai provider terpilih) | POST | PMB membuat tagihan/invoice |
| `GET /v1/invoices/{id}` | GET | PMB cek status transaksi (fallback bila webhook tidak sampai) |

---

## 4. Event & Webhook Catalog (Asinkron)

| # | Event | Producer | Consumer | Trigger | Mekanisme |
|---|---|---|---|---|---|
| 1 | `applicant.accepted_and_paid` | SI-PMB | SIAKAD | Status applicant berubah jadi "Diterima" **dan** daftar ulang lunas | Webhook HTTP (Fase 1), upgrade ke event bus jika volume besar |
| 2 | `krs.approved` | SIAKAD | LMS | KRS mahasiswa disetujui | Event (real-time) — pelengkap job pull terjadwal |
| 3 | `class.dosen_changed` | SIAKAD | LMS | Kaprodi mengubah dosen pengampu suatu kelas | Event |
| 4 | `krs_item.cancelled` | SIAKAD | LMS | Mahasiswa drop MK di tengah semester | Event — LMS nonaktifkan `class_enrollments`, riwayat submission/nilai **tidak dihapus** |
| 5 | `grade.finalized` | LMS | SIAKAD | Dosen menekan "Kunci & Publikasikan" nilai akhir kelas | Webhook |
| 6 | `payment.confirmed` (nama indikatif) | Payment Gateway | SI-PMB | Pembayaran berhasil di sisi gateway | Webhook dari provider, wajib verifikasi signature + idempotency key |
| 7 | `user.updated` (opsional) | SSO Platform | PMB, LMS, SIAKAD | Data staf (nama/email) berubah | Event, dipakai untuk refresh `users_cache` read-only jika ada |

### 4.1 Payload — `applicant.accepted_and_paid`

```json
{
  "event": "applicant.accepted_and_paid",
  "event_id": "uuid",
  "occurred_at": "2026-07-12T10:00:00Z",
  "data": {
    "pmb_applicant_id": "uuid",
    "registration_number": "PMB-2026-000123",
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "study_program_code": "string",
    "entry_path_code": "string",
    "documents_snapshot": [
      { "doc_type": "ktp", "file_url": "string", "verified_at": "timestamp" }
    ]
  }
}
```

**Idempotency**: SIAKAD wajib cek apakah `pmb_applicant_id` sudah pernah diproses (ada di kolom referensi `students.pmb_applicant_id`) sebelum membuat record `students` baru.

### 4.2 Payload — `grade.finalized`

```json
{
  "event": "grade.finalized",
  "event_id": "uuid",
  "occurred_at": "2026-07-12T10:00:00Z",
  "data": {
    "siakad_class_id": "uuid",
    "student_user_id": "uuid",
    "final_score": 88,
    "letter_grade": "A"
  }
}
```

**Catatan wewenang**: SIAKAD yang memutuskan bagaimana ini masuk ke `grade_point`/IPK resmi — LMS tidak menghitung nilai mutu, hanya mempublikasikan komponen final.

### 4.3 Payload — `krs.approved`

```json
{
  "event": "krs.approved",
  "event_id": "uuid",
  "occurred_at": "2026-07-12T10:00:00Z",
  "data": {
    "krs_item_id": "uuid",
    "class_id": "uuid",
    "student_user_id": "uuid"
  }
}
```

**Idempotency**: LMS cek `class_enrollments` sudah punya `krs_item_ref = krs_item_id` sebelum insert. Jika `lms_classes` untuk `class_id` belum tersinkron, event disimpan ke antrean tunda, diproses ulang setelah job sync kelas berikutnya (lihat `Logic-Aplikasi-LMS.md §1`).

---

## 5. Delivery & Reliability

| Aspek | Kebijakan |
|---|---|
| Mekanisme Fase 1 | Webhook HTTP sederhana (bukan message broker) — cukup untuk volume saat ini |
| Retry | Minimal 3x retry dengan exponential backoff bila consumer merespons non-2xx atau timeout |
| Idempotency key | Setiap event membawa `event_id` unik; consumer menyimpan log `event_id` yang sudah diproses |
| Urutan (ordering) | Tidak dijamin lintas event berbeda — desain consumer harus toleran terhadap event datang tidak berurutan (mis. cek state sebelum apply perubahan) |
| Kegagalan sync pull (LMS←SIAKAD) | Hanya upsert, **tidak pernah** menghapus data existing otomatis akibat pull gagal sebagian — penghapusan hanya lewat event eksplisit (`krs_item.cancelled`) |
| Monitoring | Setiap service mencatat `sync_logs`/`webhook_logs` (entity, status, row/event count, waktu) untuk observability |

---

## 6. Upgrade Path (kapan pindah dari webhook ke message broker)

Mulai dengan **webhook HTTP** (Fase 1). Pertimbangkan migrasi ke message broker (Kafka/RabbitMQ/SQS) jika salah satu kondisi berikut tercapai:

- Volume event per hari sudah signifikan (ratusan ribu+) sehingga retry HTTP point-to-point mulai membebani.
- Butuh **fan-out** ke lebih dari 2 consumer untuk satu event yang sama.
- Butuh replay event historis untuk debugging/reprocessing.

Sampai kondisi itu terjadi, webhook HTTP + idempotency key sudah cukup — sesuai rekomendasi `Catatan-Arsitektur-Microservices.md`.

---

## 7. Checklist Implementasi per Service

| Task | SSO | SI-PMB | LMS | SIAKAD |
|---|---|---|---|---|
| Registrasi sebagai `application` di SSO | — (penyedia) | ✅ | ✅ | ✅ |
| Middleware validasi JWT (via JWKS) | — | ✅ | ✅ | ✅ |
| Endpoint publish event/webhook keluar | — | ✅ (`applicant.accepted_and_paid`) | ✅ (`grade.finalized`) | ✅ (`krs.approved`, `class.dosen_changed`, `krs_item.cancelled`) |
| Endpoint terima webhook masuk | — | ✅ (`payment.confirmed`) | — | ✅ (`applicant.accepted_and_paid`, `grade.finalized`) |
| Tabel log idempotency (`event_id` terproses) | — | ✅ | ✅ | ✅ |
| API client ke service lain (server-to-server) | — | opsional | ✅ (ke SIAKAD) | — |

---

## 8. Open Items

- BRD/PRD/ERD **SIAKAD** belum diunggah secara utuh ke percakapan ini — endpoint di §3.2 disusun dari referensi yang muncul di `Catatan-Arsitektur-Microservices.md` dan `Logic-Aplikasi-LMS.md`; perlu diverifikasi ulang begitu dokumen SIAKAD lengkap tersedia.
- Pemilihan message broker (jika/ketika upgrade dari webhook) belum diputuskan — bukan blocker Fase 1.
- API Gateway (opsional tapi direkomendasikan di catatan arsitektur) belum ditentukan produknya (mis. Kong, self-built Next.js middleware, dsb).
