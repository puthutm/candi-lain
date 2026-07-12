# Product Requirements Document (PRD)
## SSO Platform — Dynamic OAuth2 Identity Provider

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 11 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL |
| Terkait | BRD-SSO-Platform.md, ERD-SSO-Platform.mermaid |

---

## 1. Ringkasan Produk

SSO Platform adalah Identity Provider (IdP) internal berbasis **OAuth2 Authorization Code Flow + PKCE** (kompatibel arah OIDC) yang:

- Mengizinkan **pendaftaran aplikasi klien secara dinamis** melalui admin console — tidak perlu redeploy sistem SSO tiap ada aplikasi baru.
- Mengizinkan **setiap aplikasi klien mendefinisikan role-nya sendiri** (dynamic role), lalu SSO menjadi tempat assignment role tersebut ke user.
- Menyediakan **modul reference data (master data) generik & standalone** yang menjadi fondasi data master untuk seluruh modul ERP mendatang.

## 2. Problem Statement

Tanpa SSO terpusat, tiap aplikasi ERP yang dibangun akan:
- Membangun ulang modul login, manajemen user, dan role dari nol.
- Menyimpan master data (jabatan, unit kerja, dsb) secara terpisah-pisah, sehingga rawan inkonsisten antar modul.
- Menyulitkan audit akses lintas aplikasi karena data user/role tersebar.

## 3. Goals & Non-Goals

**Goals**
- Satu login untuk banyak aplikasi (SSO).
- Registrasi aplikasi baru = insert data (client), bukan deploy kode baru.
- Role bersifat data-driven per aplikasi, bukan enum hardcoded.
- Master/reference data reusable lintas modul ERP.

**Non-Goals (Fase 1)**
- Belum membangun modul bisnis ERP (Finance/Inventory/dst).
- Belum mendukung Single Log-Out lintas aplikasi.
- Belum federasi ke IdP eksternal (Google/Microsoft) — namun skema `user_identities` disiapkan agar tidak perlu migrasi besar nanti.

## 4. User Roles / Personas (di level platform SSO)

| Peran | Deskripsi |
|---|---|
| **Super Admin** | Kelola seluruh aplikasi terdaftar, kelola scope global, kelola reference data, lihat semua audit log |
| **App Owner / Admin Aplikasi** | Kelola role & permission khusus aplikasinya, assign role ke user untuk aplikasinya |
| **End User** | Login via SSO, memberi/menarik consent akses aplikasi |
| **Aplikasi Klien (Service)** | Konsumen API OAuth2 (server-to-server call ke token/introspect/userinfo) |

> Catatan penting: role di atas adalah role **level SSO itu sendiri** (untuk mengelola SSO). Role **level aplikasi eksternal** (mis. "Kasir", "Approver Finance", "HR Manager") bersifat dinamis dan didefinisikan oleh masing-masing App Owner — inilah inti dari "role dinamis sesuai aplikasi luar".

## 5. Functional Requirements

### FR-1. Manajemen Aplikasi Klien (Dynamic Client Registration)
- FR-1.1 Super Admin dapat menambah aplikasi baru: nama, deskripsi, logo, redirect URI(s), allowed grant types, allowed scopes.
- FR-1.2 Sistem generate `client_id` (public) dan `client_secret` (ditampilkan sekali, disimpan sebagai hash).
- FR-1.3 Super Admin dapat menonaktifkan/mengaktifkan aplikasi tanpa menghapus data historis.
- FR-1.4 Sistem mendukung rotasi client secret.

### FR-2. Manajemen Scope
- FR-2.1 Super Admin mengelola daftar scope global (mis. `openid`, `profile`, `email`, `erp:read`, `erp:write`).
- FR-2.2 Saat registrasi aplikasi, Super Admin/App Owner memilih scope mana yang boleh diminta aplikasi tersebut.

### FR-3. Dynamic Role Management (per aplikasi)
- FR-3.1 App Owner dapat membuat role baru khusus aplikasinya (mis. "Finance Approver") tanpa melibatkan tim SSO/deploy ulang.
- FR-3.2 Role terdiri dari `role_key` (unique per app), nama, deskripsi, dan opsional daftar permission granular.
- FR-3.3 App Owner dapat menetapkan (assign) satu atau lebih role ke user tertentu, khusus untuk aplikasinya.
- FR-3.4 Role & assignment dapat dicabut (revoke) sewaktu-waktu.
- FR-3.5 Saat token diterbitkan (atau saat `/userinfo`/`/introspect` dipanggil), SSO menyertakan daftar role user untuk aplikasi terkait, sehingga aplikasi eksternal bisa melakukan otorisasi di sisi mereka (RBAC terdesentralisasi, data source tersentralisasi).

### FR-4. Alur OAuth2 (Authorization Code + PKCE)
- FR-4.1 Endpoint `GET /oauth/authorize` — menampilkan halaman login (jika belum login) lalu halaman consent, redirect kembali ke aplikasi klien dengan `authorization_code`.
- FR-4.2 Endpoint `POST /oauth/token` — menukar `authorization_code` (atau `refresh_token`) menjadi `access_token`, `refresh_token`, dan `id_token` (JWT).
- FR-4.3 Endpoint `GET /oauth/userinfo` — mengembalikan profil user + role user untuk aplikasi pemanggil, berdasarkan access token.
- FR-4.4 Endpoint `POST /oauth/introspect` — validasi status token (untuk server-to-server / resource server aplikasi klien).
- FR-4.5 Endpoint `POST /oauth/revoke` — mencabut access/refresh token.
- FR-4.6 Endpoint `GET /.well-known/jwks.json` — publish public key untuk verifikasi JWT oleh aplikasi klien.
- FR-4.7 Wajib PKCE (`code_challenge` / `code_verifier`) untuk seluruh grant type authorization_code, termasuk client confidential maupun public (SPA/mobile).

### FR-5. Consent Management
- FR-5.1 User melihat layar consent (nama aplikasi, scope yang diminta) sebelum otorisasi pertama kali.
- FR-5.2 User dapat melihat daftar aplikasi yang pernah diberi izin, dan mencabutnya kapan saja dari halaman profil.

### FR-6. Reference Data Module (Standalone Master Data)
- FR-6.1 Data referensi disusun generik: `ref_categories` (kategori, mis. "Jabatan", "Status Pegawai", "Unit Kerja") dan `ref_items` (item di dalam kategori, mendukung hierarki via `parent_id`).
- FR-6.2 Reference data tidak terikat pada satu aplikasi tertentu — dapat diakses lintas aplikasi melalui API `/api/reference/{category_code}`.
- FR-6.3 Super Admin dapat mengelola kategori & item referensi melalui admin console.
- FR-6.4 Struktur organisasi (unit kerja) disiapkan sebagai modul terpisah (`organizations`) yang dapat dikaitkan dengan user, sebagai fondasi HRIS/ERP.

### FR-7. Audit Log
- FR-7.1 Semua login, penerbitan token, revoke, perubahan role, perubahan konfigurasi aplikasi tercatat dengan aktor, waktu, dan detail perubahan.

### FR-8. Admin Console (Next.js Dashboard)
- FR-8.1 Dashboard untuk Super Admin: kelola aplikasi, scope, reference data, audit log global.
- FR-8.2 Dashboard untuk App Owner (akses dibatasi ke aplikasinya sendiri): kelola role & assignment user.

## 6. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Password di-hash (bcrypt/argon2), client secret di-hash, token JWT ditandatangani asymmetric (RS256), wajib HTTPS, rate limiting di endpoint token |
| Skalabilitas | Stateless token verification (JWT + JWKS) agar aplikasi klien tidak perlu selalu call SSO untuk validasi |
| Ketersediaan | Target uptime 99.9% (karena jadi single point of authentication) |
| Auditability | Semua write operation tercatat di audit log, tidak ada hard delete untuk data identitas |
| Performa | `/oauth/token` merespons < 300ms p95 |
| Ekstensibilitas | Skema role & reference data harus data-driven, tanpa perlu migrasi skema saat aplikasi/role baru ditambahkan |

## 7. Alur Utama (User Flow) — Authorization Code + PKCE

1. User membuka Aplikasi Eksternal → klik "Login with SSO".
2. Aplikasi Eksternal redirect ke `GET /oauth/authorize?client_id=...&redirect_uri=...&scope=...&code_challenge=...&state=...`.
3. SSO cek sesi user:
   - Jika belum login → tampilkan halaman login SSO.
   - Jika sudah login → lanjut ke step berikutnya.
4. SSO tampilkan halaman **consent** (jika belum pernah disetujui) berisi nama aplikasi & scope yang diminta.
5. User menyetujui → SSO redirect ke `redirect_uri` aplikasi eksternal dengan `code` & `state`.
6. Aplikasi Eksternal (di sisi server) memanggil `POST /oauth/token` dengan `code`, `code_verifier`, `client_id`, `client_secret`.
7. SSO validasi, lalu mengembalikan `access_token`, `refresh_token`, `id_token` (berisi klaim user + role user untuk aplikasi tsb).
8. Aplikasi Eksternal menyimpan sesi lokal berdasarkan token tersebut, dan menggunakan klaim role dari `id_token`/`userinfo` untuk otorisasi internal aplikasinya.
9. Saat token kedaluwarsa, Aplikasi Eksternal memanggil `POST /oauth/token` dengan `grant_type=refresh_token`.

## 8. Kebutuhan Data

Lihat `ERD-SSO-Platform.mermaid` untuk skema lengkap. Ringkasan entitas utama:

- **Identity**: `users`, `user_identities`
- **OAuth2 Client Management**: `applications`, `scopes`, `application_scopes`
- **Dynamic RBAC**: `application_roles`, `permissions`, `role_permissions`, `user_application_roles`
- **OAuth2 Runtime**: `oauth_authorization_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_consents`
- **Reference/Master Data (standalone)**: `ref_categories`, `ref_items`, `organizations`, `user_organizations`
- **Governance**: `audit_logs`

## 9. Spesifikasi API (Ringkas)

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/oauth/authorize` | GET | Mulai authorization code flow |
| `/oauth/token` | POST | Tukar code/refresh_token menjadi access token |
| `/oauth/userinfo` | GET | Ambil profil + role user (butuh access token) |
| `/oauth/introspect` | POST | Cek validitas token (server-to-server) |
| `/oauth/revoke` | POST | Cabut token |
| `/.well-known/jwks.json` | GET | Public key untuk verifikasi JWT |
| `/api/admin/applications` | CRUD | Kelola aplikasi klien (Super Admin) |
| `/api/admin/applications/{id}/roles` | CRUD | Kelola role dinamis per aplikasi (App Owner) |
| `/api/admin/applications/{id}/users` | CRUD | Assign/​revoke role user per aplikasi |
| `/api/reference/{category_code}` | GET | Ambil reference data (dipakai lintas modul ERP) |
| `/api/admin/reference-categories` | CRUD | Kelola kategori & item reference data |

## 10. Rencana Rilis (High-Level Roadmap)

| Fase | Cakupan |
|---|---|
| Fase 1 (MVP) | Core OAuth2 flow, dynamic client registration, dynamic role per app, reference data module, audit log dasar |
| Fase 2 | Consent management UI lengkap, MFA, token introspection caching, admin analytics |
| Fase 3 | Federasi IdP eksternal (Google/Microsoft), Single Log-Out, multi-tenant organizations penuh untuk modul ERP |

## 11. Open Questions

- Apakah dibutuhkan **multi-tenant** (beberapa perusahaan/anak usaha dalam satu instance SSO) di Fase 1, atau cukup single-tenant dulu?
- Apakah aplikasi eksternal boleh berupa **public client** (SPA/mobile tanpa client secret), yang berarti PKCE wajib tanpa client_secret?
