# SSO Platform — Drizzle Schema

Skema database untuk SSO Platform (Next.js + Drizzle ORM + PostgreSQL), turunan langsung dari `ERD-SSO-Platform.mermaid`, `BRD-SSO-Platform.md`, dan `PRD-SSO-Platform.md`.

## Struktur folder

```
db/
  schema/
    enums.ts        # pgEnum: status user, status aplikasi, dst
    users.ts         # users, user_identities
    applications.ts  # applications (OAuth2 client dinamis), scopes
    rbac.ts           # application_roles, permissions, role_permissions, user_application_roles
    oauth.ts          # authorization_codes, access_tokens, refresh_tokens, consents
    reference.ts      # ref_categories, ref_items, organizations, user_organizations
    audit.ts           # audit_logs
    index.ts            # barrel export
  relations.ts        # drizzle relations() untuk query API (db.query.*)
  index.ts             # koneksi db (Pool + drizzle)
drizzle.config.ts       # konfigurasi drizzle-kit
```

## Setup

1. Install dependency:
   ```bash
   npm install drizzle-orm pg
   npm install -D drizzle-kit
   ```

2. Set environment variable di `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/sso_platform
   ```

3. Generate migration dari schema:
   ```bash
   npx drizzle-kit generate
   ```

4. Jalankan migration ke database:
   ```bash
   npx drizzle-kit migrate
   ```

## Contoh pemakaian di Next.js (API Route / Server Action)

```ts
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";

// Registrasi aplikasi baru (dynamic client registration)
export async function registerApplication(input: {
  name: string;
  ownerUserId: string;
  redirectUris: string[];
  clientId: string;
  clientSecretHash: string;
}) {
  return db.insert(applications).values({
    name: input.name,
    ownerUserId: input.ownerUserId,
    clientId: input.clientId,
    clientSecretHash: input.clientSecretHash,
    redirectUris: JSON.stringify(input.redirectUris),
    allowedGrantTypes: JSON.stringify(["authorization_code", "refresh_token"]),
  }).returning();
}

// Ambil role dinamis milik user untuk satu aplikasi (dipakai saat menyusun klaim token)
export async function getUserRolesForApplication(userId: string, applicationId: string) {
  return db.query.userApplicationRoles.findMany({
    where: (t) =>
      eq(t.userId, userId) && eq(t.applicationId, applicationId) && eq(t.status, "active"),
    with: { role: true },
  });
}
```

## Catatan desain

- **Dynamic client registration**: tabel `applications` — menambah aplikasi baru = insert row, tanpa redeploy SSO.
- **Dynamic role per aplikasi**: tabel `application_roles` — setiap aplikasi bebas mendefinisikan role sendiri (`role_key` unik per `application_id`), lalu di-assign ke user lewat `user_application_roles`.
- **Reference data standalone**: `ref_categories` + `ref_items` bersifat generik dan hierarkis (`parent_id`), tidak terikat modul tertentu — siap dipakai lintas modul ERP.
- **Token & secret tidak pernah disimpan mentah** — hanya hash (`client_secret_hash`, `token_hash`).
- Kolom JSON (`redirect_uris`, `allowed_grant_types`, `extra_value`, `metadata`) disimpan sebagai `text` agar portable; bisa diganti ke tipe `jsonb` Postgres asli jika ingin query langsung ke isi JSON-nya (`jsonb` juga didukung Drizzle via `jsonb()`).
