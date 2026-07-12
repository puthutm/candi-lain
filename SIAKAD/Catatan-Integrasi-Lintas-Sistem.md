# Catatan Arsitektur — Integrasi Data Lintas Sistem (ERP UNSIA)

## Konteks

SSO Platform, SI-PMB, dan SIAKAD memakai tech stack yang identik (Next.js + Drizzle ORM + PostgreSQL) dan menurut BRD-SSO-Platform §8, **PostgreSQL dimaksudkan sebagai single source of truth**. Ini berarti ketiganya kemungkinan besar berbagi **satu database** (modular monolith / satu skema besar dgn beberapa schema/namespace) — bukan tiga layanan terpisah yang saling panggil API.

**Implikasinya:** relasi antar sistem yang sebelumnya saya tulis sebagai *soft reference* (kolom `string`/`uuid` dengan komentar `"ref SSO users.id"`, tanpa `FOREIGN KEY` sungguhan) **seharusnya jadi FK asli** dengan `REFERENCES` constraint — karena tabel tujuannya memang ada di database yang sama. Ini memberi integritas data yang lebih kuat (tidak ada `verified_by_user_id` yang menunjuk ke user yang tidak ada), dan query lintas modul (`db.query.applicants.findMany({ with: { verifiedByUser: true } })`) bisa langsung jalan tanpa perlu API call terpisah.

## 3 Titik Integrasi yang Diperbaiki

| # | Sebelumnya (soft-ref) | Sekarang (FK asli) | Alasan |
|---|---|---|---|
| 1 | `applicant_documents.verified_by_staff_id` — string, komentar "ref SSO users.id" | `verified_by_user_id UUID REFERENCES sso_users(id)` | Staf yang verifikasi berkas PMB adalah user SSO yang sama |
| 2 | `students.pmb_applicant_ref` — uuid lepas tanpa constraint | `applicant_id UUID REFERENCES pmb_applicants(id)` | Mahasiswa **adalah** pendaftar PMB yang naik status, bukan entitas baru yang kebetulan mirip |
| 3 | `students.sso_username` / `lecturers.sso_username` — string | `user_id UUID REFERENCES sso_users(id)` | Login mahasiswa & dosen memakai akun SSO yang sama, bukan field teks bebas |

Pola yang sama berlaku untuk `changed_by_staff_id`, `graded_by_staff_id` (PMB), dan `graded_by_lecturer_id`, `dosen_pa_id` (SIAKAD) — semua jadi FK ke `sso_users` atau ke tabel lokal yang sudah benar.

## Peluang Konsolidasi Master Data (opsional, perlu keputusan produk)

SSO Platform sudah punya **Reference Data Module generik** (`ref_categories` + `ref_items`, mendukung hierarki) yang menurut PRD-nya memang dirancang *"reusable lintas modul ERP"*. Ada 2 kandidat konsolidasi:

1. **`document_types` (PMB)** → bisa jadi `ref_items` dengan `category = "JENIS_DOKUMEN"`, alih-alih tabel lokal terpisah. Manfaat: kalau SIAKAD nanti juga butuh jenis dokumen (mis. untuk persuratan), tidak perlu bikin tabel baru lagi.
2. **`study_programs` (SIAKAD)** → *lebih hati-hati* — prodi punya atribut khusus (kaprodi, akreditasi, kurikulum) yang tidak cocok dipaksakan ke `ref_items` generik. Lebih masuk akal `study_programs` tetap jadi tabel sendiri, tapi **terhubung** ke `organizations` SSO (mis. `organizations.id` sebagai representasi unit kerja resmi, `study_programs.organization_id` sebagai FK) — bukan digantikan sepenuhnya.

Ini saya tandai sebagai *usulan* (garis di ERD), bukan keputusan final — perlu dikonfirmasi ke pemilik produk sebelum diterapkan, karena mengubah `document_types` jadi data generik berarti UI admin PMB untuk kelola jenis dokumen juga harus pindah ke Pengaturan Reference Data di SSO.

## Dampak ke Dokumen Sebelumnya

File ERD per-sistem (`ERD-SSO-Platform.mermaid`, `ERD-SI-PMB-UNSIA.mermaid`, `ERD-SIAKAD-UNSIA.mermaid`) **tetap valid** sebagai dokumentasi skema per-domain — saya tidak mengubahnya, supaya tiap tim/modul tetap punya referensi yang fokus ke areanya. ERD Integrasi ini adalah **lapisan tambahan** yang khusus menunjukkan bagaimana ketiganya saling mengunci sebagai satu ERP, dan sebaiknya jadi rujukan saat menulis migrasi Drizzle supaya FK antar-modul dibuat sejak awal, bukan ditambal belakangan.

```mermaid
%% Lihat file terpisah: ERD-Integrasi-Lintas-Sistem.mermaid
```
