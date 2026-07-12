# ERD & Flow Bisnis — SSO Platform

## Sistem Single Sign-On (SSO) dengan Dynamic OAuth2 Client & Dynamic Role Management

| Metadata | Keterangan |
|---|---|
| Terkait | BRD-SSO-Platform.md, PRD-SSO-Platform.md |
| Versi | 1.0 |
| Tanggal | 11 Juli 2026 |

---

## 1. Entity Relationship Diagram (ERD)

Skema data inti SSO Platform, terbagi ke 5 domain: **Identity** (`users`, `user_identities`), **OAuth2 Client Management** (`applications`, `scopes`, `application_scopes`), **Dynamic RBAC** (`application_roles`, `permissions`, `role_permissions`, `user_application_roles`), **OAuth2 Runtime** (`oauth_authorization_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_consents`), dan **Reference/Master Data** (`ref_categories`, `ref_items`, `organizations`, `user_organizations`), ditambah **Governance** (`audit_logs`).

```mermaid
erDiagram

    USERS ||--o{ USER_IDENTITIES : "punya"
    USERS ||--o{ USER_APPLICATION_ROLES : "diberi_role"
    USERS ||--o{ OAUTH_CONSENTS : "memberi_consent"
    USERS ||--o{ OAUTH_AUTHORIZATION_CODES : "meminta"
    USERS ||--o{ OAUTH_ACCESS_TOKENS : "memiliki"
    USERS ||--o{ USER_ORGANIZATIONS : "tergabung"
    USERS ||--o{ APPLICATIONS : "owner_dari"
    USERS ||--o{ AUDIT_LOGS : "melakukan"

    APPLICATIONS ||--o{ APPLICATION_SCOPES : "mengizinkan"
    APPLICATIONS ||--o{ APPLICATION_ROLES : "mendefinisikan"
    APPLICATIONS ||--o{ USER_APPLICATION_ROLES : "target"
    APPLICATIONS ||--o{ OAUTH_AUTHORIZATION_CODES : "diminta_untuk"
    APPLICATIONS ||--o{ OAUTH_ACCESS_TOKENS : "diterbitkan_untuk"
    APPLICATIONS ||--o{ OAUTH_CONSENTS : "disetujui_untuk"

    SCOPES ||--o{ APPLICATION_SCOPES : "digunakan_oleh"

    APPLICATION_ROLES ||--o{ USER_APPLICATION_ROLES : "diberikan_sebagai"
    APPLICATION_ROLES ||--o{ ROLE_PERMISSIONS : "memiliki"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "melekat_pada"
    APPLICATIONS ||--o{ PERMISSIONS : "mendefinisikan"

    OAUTH_ACCESS_TOKENS ||--o| OAUTH_REFRESH_TOKENS : "berpasangan"

    REF_CATEGORIES ||--o{ REF_ITEMS : "berisi"
    REF_ITEMS ||--o{ REF_ITEMS : "sub_item_dari"

    ORGANIZATIONS ||--o{ ORGANIZATIONS : "sub_unit_dari"
    ORGANIZATIONS ||--o{ USER_ORGANIZATIONS : "menaungi"
    REF_ITEMS ||--o{ USER_ORGANIZATIONS : "sebagai_jabatan"

    USERS {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        string status "active|inactive|locked"
        boolean mfa_enabled
        timestamp created_at
        timestamp updated_at
    }

    USER_IDENTITIES {
        uuid id PK
        uuid user_id FK
        string provider "local|google|microsoft"
        string provider_user_id
        timestamp created_at
    }

    APPLICATIONS {
        uuid id PK
        string client_id UK
        string client_secret_hash
        string name
        string description
        text redirect_uris "json array"
        text allowed_grant_types "json array"
        string logo_url
        uuid owner_user_id FK
        string status "active|inactive"
        timestamp created_at
        timestamp updated_at
    }

    SCOPES {
        uuid id PK
        string code UK "openid|profile|email|erp:read"
        string description
    }

    APPLICATION_SCOPES {
        uuid id PK
        uuid application_id FK
        uuid scope_id FK
    }

    APPLICATION_ROLES {
        uuid id PK
        uuid application_id FK
        string role_key "unique per application"
        string role_name
        string description
        boolean is_default
        timestamp created_at
    }

    PERMISSIONS {
        uuid id PK
        uuid application_id FK
        string permission_key
        string description
    }

    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }

    USER_APPLICATION_ROLES {
        uuid id PK
        uuid user_id FK
        uuid application_id FK
        uuid role_id FK
        uuid granted_by FK
        timestamp granted_at
        string status "active|revoked"
    }

    OAUTH_AUTHORIZATION_CODES {
        uuid id PK
        string code UK
        uuid user_id FK
        uuid application_id FK
        string redirect_uri
        string scope
        string code_challenge
        string code_challenge_method
        timestamp expires_at
        boolean used
    }

    OAUTH_ACCESS_TOKENS {
        uuid id PK
        string token_hash UK
        uuid user_id FK
        uuid application_id FK
        string scope
        timestamp expires_at
        timestamp created_at
        boolean revoked
    }

    OAUTH_REFRESH_TOKENS {
        uuid id PK
        string token_hash UK
        uuid access_token_id FK
        timestamp expires_at
        boolean revoked
    }

    OAUTH_CONSENTS {
        uuid id PK
        uuid user_id FK
        uuid application_id FK
        string scope
        timestamp granted_at
        timestamp revoked_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_user_id FK
        string action
        string entity_type
        string entity_id
        text metadata "json"
        timestamp created_at
    }

    REF_CATEGORIES {
        uuid id PK
        string code UK "JABATAN|STATUS_PEGAWAI|UNIT_KERJA"
        string name
        string description
        timestamp created_at
    }

    REF_ITEMS {
        uuid id PK
        uuid category_id FK
        uuid parent_id FK "self reference, nullable"
        string code
        string name
        text extra_value "json, optional"
        int sort_order
        boolean is_active
    }

    ORGANIZATIONS {
        uuid id PK
        string code UK
        string name
        uuid parent_id FK "self reference, nullable"
        string type "company|division|department"
        boolean is_active
    }

    USER_ORGANIZATIONS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        uuid position_ref_item_id FK "ref ke REF_ITEMS kategori JABATAN"
        boolean is_primary
    }
```

---

## 2. Flow Bisnis

Alur bisnis end-to-end SSO Platform, digambarkan dalam 5 lane: **Super Admin**, **App Owner**, **Aplikasi Eksternal (Client)**, **End User**, dan **SSO Platform (System)**. Mencakup 5 sub-alur yang saling terhubung:

1. **Onboarding Aplikasi Klien** — Super Admin mendaftarkan aplikasi baru secara self-service (generate `client_id`/`client_secret`).
2. **Dynamic Role Management** — App Owner membuat role khusus aplikasinya & assign ke user, tanpa melibatkan tim SSO.
3. **Login OAuth2 (Authorization Code + PKCE)** — alur inti otentikasi lintas aplikasi.
4. **Refresh Token** — perpanjangan sesi tanpa login ulang.
5. **Consent Management** — user meninjau & mencabut izin akses aplikasi kapan saja.

Seluruh aksi tercatat ke `audit_logs` (garis putus-putus pada diagram).

```mermaid
flowchart TD

    Start([Mulai]) --> SA1

    subgraph L1["🛡️ Super Admin"]
        SA1[Buka Admin Console]
        SA2[Tambah Aplikasi Baru: nama, redirect URI, scope, grant type]
        SA3[Terima client_id & client_secret - ditampilkan sekali]
        SA4{Perlu rotasi/nonaktifkan aplikasi?}
        SA5[Rotasi client_secret / Set status inactive]
    end

    subgraph L2["👔 App Owner"]
        AO1[Buat Role Dinamis untuk Aplikasi - role_key, nama, permission]
        AO2[Pilih User]
        AO3[Assign Role ke User untuk Aplikasi Tsb]
        AO4{Perlu cabut role?}
        AO5[Revoke user_application_roles]
    end

    subgraph L3["💻 Aplikasi Eksternal (Client)"]
        CE1[User klik 'Login with SSO']
        CE2["Redirect ke GET /oauth/authorize
        (client_id, redirect_uri, scope, code_challenge, state)"]
        CE3["Server App: POST /oauth/token
        (code, code_verifier, client_id, client_secret)"]
        CE4[Simpan sesi lokal + terapkan otorisasi berbasis klaim role]
        CE5["Saat token expired: POST /oauth/token
        (grant_type=refresh_token)"]
    end

    subgraph L4["🙋 End User"]
        EU1[Input Username & Password]
        EU2[Lihat Halaman Consent - nama app & scope diminta]
        EU3[Setujui Consent]
        EU4[Gunakan Aplikasi Eksternal]
        EU5[Buka Halaman Profil SSO]
        EU6[Lihat Daftar Aplikasi Diberi Izin]
        EU7{Cabut akses aplikasi tertentu?}
    end

    subgraph L5["⚙️ SSO Platform (System)"]
        SYS1[Generate client_id & hash client_secret]
        SYS2[Simpan applications + application_scopes]
        SYS3[Simpan application_roles]
        SYS4[Simpan user_application_roles]
        SYS5{User sudah punya sesi login aktif?}
        SYS6[Validasi kredensial & buat sesi]
        SYS7{Consent utk app+scope ini sudah pernah diberikan?}
        SYS8[Simpan oauth_consents]
        SYS9[Generate authorization_code + simpan code_challenge]
        SYS10["Redirect ke redirect_uri
        dengan code & state"]
        SYS11["Validasi code, PKCE (code_verifier),
        client_id/client_secret"]
        SYS12[Ambil role user untuk aplikasi ini dari user_application_roles]
        SYS13["Generate access_token, refresh_token, id_token
        (klaim profil + role)"]
        SYS14[Revoke consent & seluruh token terkait]
        SYS15[(Catat ke audit_logs: aktor, waktu, detail)]
    end

    %% ---- Flow 1: Onboarding Aplikasi Klien ----
    SA1 --> SA2 --> SYS1 --> SYS2 --> SA3
    SA3 --> SA4
    SA4 -- ya --> SA5 --> SYS15
    SA4 -- tidak --> AO1
    SYS2 -.log.-> SYS15

    %% ---- Flow 2: Dynamic Role Management ----
    AO1 --> SYS3 --> SYS15
    SYS3 --> AO2 --> AO3 --> SYS4 --> SYS15
    SYS4 --> AO4
    AO4 -- ya --> AO5 --> SYS15
    AO4 -- tidak --> CE1

    %% ---- Flow 3: Login OAuth2 Authorization Code + PKCE ----
    CE1 --> CE2 --> SYS5
    SYS5 -- belum login --> EU1 --> SYS6 --> SYS7
    SYS5 -- sudah login --> SYS7
    SYS7 -- belum pernah --> EU2 --> EU3 --> SYS8 --> SYS9
    SYS7 -- sudah pernah --> SYS9
    SYS9 --> SYS10 --> CE3
    CE3 --> SYS11
    SYS11 --> SYS12 --> SYS13 --> CE4
    SYS13 -.log.-> SYS15
    CE4 --> EU4

    %% ---- Flow 4: Refresh Token ----
    EU4 -.saat sesi berjalan.-> CE5
    CE5 --> SYS11

    %% ---- Flow 5: Consent Management (Revoke) ----
    EU4 --> EU5 --> EU6 --> EU7
    EU7 -- ya --> SYS14 --> SYS15 --> End([Selesai])
    EU7 -- tidak --> End

    classDef decision fill:#FFF3CD,stroke:#B8860B,color:#000
    classDef system fill:#DCEAF7,stroke:#2C6FAA,color:#000
    classDef audit fill:#E8E8E8,stroke:#666,color:#000,stroke-dasharray: 3 3
    class SA4,SYS5,SYS7,AO4,EU7 decision
    class SYS1,SYS2,SYS3,SYS4,SYS6,SYS8,SYS9,SYS10,SYS11,SYS12,SYS13,SYS14 system
    class SYS15 audit
```
