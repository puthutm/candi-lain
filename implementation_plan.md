# Implementation Plan — Integrasi End-to-End & Kesiapan Production ERP UNSIA

Rencana kerja ini bertujuan untuk mengonsolidasikan integrasi akhir lintas 7 platform microservices ERP UNSIA (**SSO**, **PMB**, **SIAKAD**, **LMS ICEMS**, **Keuangan (SKEU/SKEUM)**, **HRIS**, dan **Bank Konten**), memastikan kesiapan deployment containerized Docker, serta melakukan verifikasi hardening keamanan & performa.

---

## User Review Required

> [!IMPORTANT]
> **Dynamic Network & IP Configuration**:
> Penyesuaian variabel lingkungan (`.env`) untuk deployment antar-node/server disatukan melalui script `inject-env.js` dengan target IP publik/internal yang dapat ditentukan secara dinamis.

> [!NOTE]
> **Idempotensi Webhook & Event Bus**:
> Seluruh consumer webhook (PMB $\rightarrow$ SIAKAD, SIAKAD $\rightarrow$ LMS, LMS $\rightarrow$ SIAKAD, HRIS $\rightarrow$ SKEU) mewajibkan verifikasi HMAC signature dan pemeriksaan `event_id` idempotent untuk mencegah eksekusi ganda.

---

## Open Questions

> [!NOTE]
> **1. Production Deployment Host Target**:
> Apakah penyiapan staging/production docker-compose akan dijalankan pada single host (seperti IP default `10.10.20.56`) atau dialokasikan pada multi-host/Kubernetes cluster?

---

## Proposed Changes

### 1. Hardening & Security Integration (`sso-platform`, `keuangan-platform`, `siakad-platform`)

---

#### [MODIFY] [jwks-cache.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/sso-platform/lib/jwks-cache.ts)
- Verifikasi in-memory caching token JWKS dengan TTL 1 jam dan mekanisme rotation fallback saat signature failure.

#### [MODIFY] [rate-limiter.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/lib/rate-limiter.ts)
- Penguatan sliding window rate-limiter (10 req/menit) pada API webhook pembayaran & transaksi sensitif.

#### [MODIFY] [query-cache.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/siakad-platform/lib/query-cache.ts)
- Evaluasi invalidasi cache query metadata periode akademik, prodi, dan struktur UKT/SPP.

---

### 2. End-to-End Cross-Service Workflow Orchestration

---

#### [MODIFY] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/hris-platform/app/api/payroll/disburse-to-skeu/route.ts)
- Sinkronisasi payload disbursement penggajian staf/dosen dari HRIS ke Modul Keuangan (SKEU) untuk pencatatan Jurnal Akuntansi otomatis.

#### [MODIFY] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/app/api/webhooks/payment/route.ts)
- Penanganan auto-clearance finansial mahasiswa setelah pembayaran invoice lunas dan dispatch event ke SIAKAD.

---

### 3. Docker Containerization & Environment Scripting

---

#### [MODIFY] [docker-compose.yml](file:///d:/Superman/Superman/Coding/candi/candi-lain/docker-compose.yml)
- Penyelarasan urutan booting container (`db` $\rightarrow$ `redis` $\rightarrow$ `migrate-all` $\rightarrow$ `seed-superadmin` $\rightarrow$ microservices) serta healthcheck status.

#### [MODIFY] [inject-env.js](file:///d:/Superman/Superman/Coding/candi/candi-lain/inject-env.js)
- Penyesuaian script otomatisasi pembaruan Host IP pada seluruh 7 platform.

---

## Verification Plan

### Automated Tests
- Menjalankan pemeriksaan tipe TypeScript pada seluruh sub-sistem:
  ```powershell
  npx tsc --noEmit
  ```
- Validasi script migrasi database & seeding:
  ```powershell
  node inject-env.js 10.10.20.56
  ```

### Manual Verification
1. **SSO OAuth2 & Role Token Verification**:
   - Memastikan SSO memproduksi JWT ber-claim lengkap (roles, prodi, tenant ID) dan dapat diverifikasi oleh JWKS Cache di service pemanggil.
2. **End-to-End Flow Test**:
   - **Alur PMB $\rightarrow$ SIAKAD**: Pendaftaran & kelulusan PMB $\rightarrow$ Webhook trigger auto-create NIM Mahasiswa di SIAKAD.
   - **Alur Keuangan $\rightarrow$ Clearance**: Tagihan SPP/UKT $\rightarrow$ Pembayaran via Gateway $\rightarrow$ Webhook SKEU $\rightarrow$ Auto Clearance status di SIAKAD.
   - **Alur Payroll HRIS $\rightarrow$ Keuangan**: Payroll run 5-step $\rightarrow$ Approval $\rightarrow$ Post Jurnal Penggajian ke SKEU.
