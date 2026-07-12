# Business Requirements Document (BRD)
## Sistem Single Sign-On (SSO) dengan Dynamic OAuth2 Client & Dynamic Role Management

| Metadata | Keterangan |
|---|---|
| Nama Proyek | SSO Platform (Fondasi Identity Provider untuk ekosistem ERP) |
| Versi Dokumen | 1.0 |
| Tanggal | 11 Juli 2026 |
| Status | Draft |
| Tech Stack Target | Next.js (Fullstack), Drizzle ORM, PostgreSQL |

---

## 1. Latar Belakang

Perusahaan berencana membangun sejumlah aplikasi internal (mis. HRIS, Finance, Inventory, Procurement) yang ke depan akan bermuara menjadi satu ekosistem **ERP**. Alih-alih tiap aplikasi punya sistem login & manajemen user sendiri-sendiri, dibutuhkan satu **Identity Provider (IdP) terpusat** yang:

1. Menjadi satu-satunya sumber otentikasi (Single Sign-On) untuk seluruh aplikasi internal maupun aplikasi pihak ketiga (eksternal) yang akan diintegrasikan di masa depan.
2. Mendukung penambahan aplikasi klien secara **dinamis** (tanpa deploy ulang sistem SSO) — cukup didaftarkan lewat admin console.
3. Mendukung **role yang dinamis per aplikasi** — karena tiap aplikasi (HRIS, Finance, dst) punya kebutuhan role/hak akses yang berbeda-beda, dan role tersebut tidak bisa di-hardcode di level SSO.
4. Menyediakan **data referensi (master data) yang berdiri sendiri (standalone)** — tidak menempel ke satu aplikasi tertentu — sehingga bisa dipakai bersama oleh seluruh modul ERP nantinya (contoh: master jabatan, unit kerja, status pegawai, dsb).

## 2. Tujuan Bisnis

- **BO-01**: Mengurangi duplikasi sistem login/otentikasi di setiap aplikasi internal.
- **BO-02**: Mempercepat onboarding aplikasi baru ke ekosistem perusahaan (self-service client registration).
- **BO-03**: Memberi kontrol akses terpusat namun fleksibel — tiap aplikasi tetap bisa mendefinisikan role/hak aksesnya sendiri.
- **BO-04**: Membangun fondasi data referensi yang konsisten agar tidak terjadi duplikasi master data ketika modul-modul ERP mulai dibangun.
- **BO-05**: Meningkatkan keamanan (satu titik audit, satu kebijakan password/MFA, satu titik revoke akses).

## 3. Ruang Lingkup (Scope)

### 3.1 Termasuk dalam scope
- Modul otentikasi & otorisasi berbasis **OAuth2 / OIDC** (Authorization Code Flow + PKCE).
- Admin console untuk registrasi aplikasi klien baru (client_id/client_secret, redirect URI, scope).
- Modul **dynamic role management** per aplikasi (setiap aplikasi bisa mendefinisikan role sendiri, lalu SSO memetakan user ke role tersebut).
- Modul **reference data (master data) standalone** yang dapat dikonsumsi lintas aplikasi via API.
- User consent screen, token issuance (access token, refresh token, id token), token revocation, introspection.
- Audit log seluruh aktivitas otentikasi & administrasi.

### 3.2 Tidak termasuk dalam scope (Fase 1)
- Modul-modul bisnis ERP itu sendiri (Finance, Inventory, dll) — hanya fondasi identity & referensinya.
- Single Log-Out (SLO) lintas aplikasi — dipertimbangkan di fase berikutnya.
- Federasi ke IdP eksternal (Google/Microsoft SSO) — dipertimbangkan di fase berikutnya (arsitektur harus tetap membuka kemungkinan ini).

## 4. Stakeholder

| Peran | Kepentingan |
|---|---|
| Product Owner / Manajemen | Fondasi ekosistem ERP jangka panjang |
| Tim IT/Infra | Keamanan, kemudahan integrasi aplikasi baru |
| Tim Developer Aplikasi Internal | Kemudahan integrasi OAuth2, kejelasan kontrak API |
| Admin SSO (Super Admin) | Mengelola aplikasi terdaftar, role, dan user |
| Admin Aplikasi (App Owner) | Mengelola role & assignment user khusus aplikasinya |
| End User (Pegawai) | Login sekali untuk akses banyak aplikasi |

## 5. Kebutuhan Bisnis (Business Requirements)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| BR-01 | User dapat login sekali dan mengakses semua aplikasi terdaftar tanpa login ulang (SSO) | Must Have |
| BR-02 | Admin dapat mendaftarkan aplikasi eksternal/internal baru secara mandiri (self-service), menghasilkan client_id & client_secret | Must Have |
| BR-03 | Setiap aplikasi terdaftar dapat mendefinisikan role sendiri (dinamis), tidak dibatasi daftar role tetap di SSO | Must Have |
| BR-04 | Admin aplikasi dapat menetapkan role tertentu ke user untuk aplikasi miliknya | Must Have |
| BR-05 | SSO menyediakan data referensi (master data) terpusat yang independen dari modul aplikasi manapun, siap dipakai ERP | Must Have |
| BR-06 | Seluruh transaksi otentikasi, perubahan role, dan perubahan konfigurasi aplikasi tercatat di audit log | Must Have |
| BR-07 | Token akses dapat dicabut (revoke) sewaktu-waktu oleh admin | Must Have |
| BR-08 | User dapat melihat & mencabut consent/akses yang pernah diberikan ke aplikasi tertentu | Should Have |
| BR-09 | Sistem mendukung multi-tenant/organisasi (unit kerja) untuk kebutuhan ERP ke depan | Should Have |
| BR-10 | Sistem mendukung MFA (Multi-Factor Authentication) | Could Have (Fase 2) |

## 6. Metrik Keberhasilan (Success Metrics)

- 100% aplikasi internal baru terintegrasi tanpa membangun modul login sendiri.
- Waktu onboarding aplikasi baru ke SSO < 1 hari kerja.
- Zero downtime saat penambahan aplikasi/role baru (karena bersifat data-driven, bukan hardcode).
- Seluruh insiden akses tidak sah dapat ditelusuri lewat audit log dalam < 15 menit.

## 7. Asumsi

- Seluruh aplikasi yang diintegrasikan mendukung standar OAuth2/OIDC.
- Tim pengembang aplikasi klien memiliki kemampuan mengimplementasikan Authorization Code Flow + PKCE.
- PostgreSQL menjadi single source of truth untuk data identitas & referensi di fase awal.

## 8. Batasan (Constraints)

- Tech stack ditentukan: Next.js (App Router, fullstack API), Drizzle ORM, PostgreSQL.
- Data referensi harus dirancang generik/standalone agar tidak perlu migrasi skema besar saat modul ERP baru ditambahkan.

## 9. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Client secret bocor | Tinggi | Simpan hanya hash, rotasi berkala, rate limit |
| Role per aplikasi jadi tidak terkontrol (role sprawl) | Sedang | Validasi & approval saat pembuatan role baru oleh Super Admin |
| Reference data tidak konsisten dipakai antar tim | Sedang | Tata kelola (governance) & dokumentasi kategori referensi |
| Single point of failure (SSO down = semua app down) | Tinggi | HA setup, caching token di sisi klien, monitoring |

## 10. Ketergantungan (Dependencies)

- Infrastruktur PostgreSQL (managed atau self-hosted) dengan backup & HA.
- Kebijakan keamanan perusahaan (password policy, session policy).
