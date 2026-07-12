# Implementation Plan - OAuth Authorization Server Initialization & Client Setup

This implementation plan outlines the steps to resolve schema mismatches between the client platforms and the central Single Sign-On (SSO) database schema, and defines a robust automatic seeding mechanism to configure default users, applications, and roles for the authorization flow.

## User Review Required

> [!IMPORTANT]
> **Database Schema Mismatch Fix**: 
> The client-side database schemas in `siakad-platform/db/schema/sso.ts` and `lms-platform/db/schema/sso.ts` define a column `clientName` mapping to a database field `client_name`. However, the actual database table `applications` (created by the migration `0000_workable_impossible_man.sql` of the `sso-platform`) only contains a column named `name`. We will correct this mismatch in the client platforms to prevent database query failures.

> [!TIP]
> **Automatic Database Seeding**:
> Since database platforms are empty in local development, we will build a seeding module in `sso-platform` that executes automatically when the `/oauth/authorize` route is accessed. This seeds the default OAuth applications (`siakad-platform`, `lms-platform`, `pmb-platform`), standard OpenID scopes, default users (Admin, Mahasiswa, Dosen), and role mappings.

## Proposed Changes

### Central Identity Provider (SSO Platform)

---

#### [NEW] [seed.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/sso-platform/lib/seed.ts)
We will create a module to seed the central `sso_platform` database if it is unpopulated.
- Seed default scopes: `openid`, `profile`, `email`.
- Seed default client applications:
  - `siakad-platform` (secret: `siakad-platform-client-secret-key-2026`, redirect URI: `http://localhost:3003/api/auth/callback`)
  - `lms-platform` (secret: `lms-platform-client-secret-key-2026`, redirect URI: `http://localhost:3004/api/auth/callback`)
  - `pmb-platform` (secret: `pmb-platform-client-secret-key-2026`, redirect URI: `http://localhost:3002/api/auth/callback`)
- Seed default users with hashed passwords using bcrypt:
  - `admin@example.com` (username: `admin`, password: `admin-password-123`)
  - `mahasiswa@example.com` (username: `mahasiswa`, password: `mahasiswa-password-123`)
  - `dosen@example.com` (username: `dosen`, password: `dosen-password-123`)
- Seed application-specific roles:
  - `siakad-platform`: `mahasiswa` (Mahasiswa), `dosen` (Dosen), `kaprodi` (Kaprodi), `baak` (Staf BAAK)
  - `lms-platform`: `mahasiswa` (Mahasiswa), `dosen` (Dosen)
- Assign roles to users in `user_application_roles` (e.g., `mahasiswa` user assigned to `mahasiswa` role in SIAKAD and LMS; `dosen` user assigned to `dosen` role).

#### [MODIFY] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/sso-platform/app/oauth/authorize/route.ts)
- Import and call the database seeding check at the top of the `GET` handler.

#### [NEW] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/sso-platform/app/api/seed/route.ts)
- Create a dedicated manual seed endpoint `/api/seed` in `sso-platform` for debug/manual seeding.

---

### Client Platforms (SIAKAD & LMS)

---

#### [MODIFY] [sso.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/siakad-platform/db/schema/sso.ts)
- Fix column `clientName` mapped to `client_name` by changing it to `name` mapped to `name` matching the central database applications table schema.

#### [MODIFY] [sso.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/lms-platform/db/schema/sso.ts)
- Fix the column mapping for `applications` table similarly.

## Verification Plan

### Automated Verification
- Review query logs of compilation output to confirm that no non-existent columns (like `client_name`) are selected.

### Manual Verification
1. Access the authorization flow URL:
   `http://localhost:3000/oauth/authorize?client_id=siakad-platform&redirect_uri=http://localhost:3003/api/auth/callback&response_type=code&code_challenge=mock_challenge&code_challenge_method=plain&scope=openid`
2. Ensure the login page loads and credentials `admin@example.com` / `admin-password-123` or `mahasiswa@example.com` / `mahasiswa-password-123` work.
3. Complete the consent screen and verify that redirection to `siakad-platform`'s callback URL succeeds without database errors.
