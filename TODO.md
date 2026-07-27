# TODO - Implementasi Sistem Informasi UNSIA

## ✅ PMB Platform — Selesai (Sprint 0-5)
- [x] Foundation & Setup
- [x] Admin Panel Pembayaran & Pengaturan
- [x] Payment Gateway Integration
- [x] Notifikasi & Komunikasi
- [x] SSO Dynamic Roles & Security
- [x] Penyempurnaan CBT & Funnel

## ✅ Modul Keuangan (SKEU & SKEUM) — ✅ SELESAI & BUILD BERHASIL (Fase 1 MVP)

### Epic A — Foundation & Infrastructure Enhancement
- [x] A1: Schema database (accounting.ts, installment.ts, bank.ts)
- [x] A2: Payment Gateway Library (gateway-types.ts, midtrans-provider.ts, gateway-registry.ts)
- [x] A3: SIAKAD API Client (siakad-client.ts)
- [x] A4: SSO roles & auth enhancement (auth.ts) — role spesifik Keuangan
- [x] A5: Setup environment variables, proxy.ts (Next.js 16), middleware
- [x] A6: Generate & run migrasi Drizzle

### Epic B — Master Tarif Enhancement
- [x] B1: GET /api/skeu/tuition-rates (list all)
- [x] B2: DELETE /api/skeu/tuition-rates/[id]
- [x] B3: GET/POST /api/skeu/pmb-fee-rates (CRUD PMB fee rates)
- [x] B4: GET/POST /api/skeu/coa (Chart of Accounts dengan filter)
- [x] B5: Approval workflow Yayasan untuk perubahan tarif (/api/skeu/tuition-rates/approve)

### Epic C — Penerimaan Mahasiswa (Core)
- [x] C1: POST /api/skeu/invoices/generate (generate tagihan massal)
- [x] C2: GET /api/skeu/invoices (daftar tagihan + filter/paginate)
- [x] C3: POST /api/webhooks/payment (webhook idempotent + SIAKAD publish)
- [x] C4: POST /api/skeu/invoices/resync (Force Re-sync PG)
- [x] C5: GET /api/skeu/stats (dashboard collection rate, aging, channel)

### Epic D — Portal Mahasiswa (SKEUM Enhancement)
- [x] D1: GET /api/skeum/data (tagihan, riwayat, clearance, summary)
- [x] D2: POST /api/skeum/pay (checkout via gateway registry)
- [x] D3: Riwayat transaksi + e-kuitansi (/api/skeum/kuitansi/[id])
- [x] D4: SSO login + navigasi ke induk (AppSwitcher + SKEUM Portal)

### Epic E — Status Clearance Finansial
- [x] E1: POST /api/skeu/clearance/check (auto-detect overdue → tertahan + SIAKAD publish)
- [x] E2: Webhook payment otomatis reversal clearance saat lunas
- [x] E3: Publish event clearance ke LMS/SIAKAD (via siakad-client.ts)
- [x] E4: Reversal otomatis saat bayar lunas (done via webhook)
- [x] E5: UI Status Clearance di Admin (/admin/clearance/page.tsx)

### Build Verification
- [x] `npx tsc --noEmit` — ✅ LULUS (no errors)
- [x] `npx next build` — ✅ LULUS (34 routes compiled)
- [x] Proxy (middleware) aktif untuk SSO auth
- [x] Semua API route terdaftar & siap

---
**Estimasi Fase 1: ± 8 minggu**
**Status: ✅ Selesai & Siap Deploy (Fase 1 MVP)**

---

## ✅ SIAKAD Platform — Core Akademik, KRS & Transkrip (SELESAI)
- [x] S1: Webhook Consumer PMB (`/api/webhooks/pmb`) — Auto-create Mahasiswa Baru & KRS Perdana.
- [x] S2: KRS Engine & Validator (`lib/krs-validator.ts`) — Batas SKS dinamis berdasarkan IPS.
- [x] S3: Grading & Transkrip Calculator (`lib/grade-calculator.ts`) — Konversi nilai mutu & perhitungan IPS/IPK.
- [x] S4: API Pengajuan KRS (`/api/krs/submit`) & Approval Dosen PA (`/api/krs/approve`).
- [x] S5: API Transkrip Nilai & KHS Mahasiswa (`/api/student/transcript`).

---

## ✅ LMS ICEMS Platform — Auto-Enrolment & Grade Publisher (SELESAI)
- [x] L1: Webhook Consumer SIAKAD (`/api/webhooks/siakad`) — Auto-enrolment `krs.approved` & update dosen.
- [x] L2: Grade Publisher (`lib/siakad-publisher.ts`) — Integrasi real-time nilai akhir LMS ke SIAKAD.
- [x] L3: API Grade Finalize (`/api/grades/finalize`) — Dosen kunci & kirim nilai ke SIAKAD.
- [x] L4: Consumer Webhook LMS di SIAKAD (`/api/webhooks/lms`) — Upsert nilai ke KHS & hitung IPK.

---

## ✅ Modul Keuangan (Fase 2 - Enterprise Financial ERP) (SELESAI)
- [x] F1: Reports Engine (`lib/financial-reports.ts`) — Laporan Laba/Rugi (`/api/skeu/reports/income-statement`) & Neraca (`/api/skeu/reports/balance-sheet`).
- [x] F2: Bank Reconciliation Engine (`lib/reconciliation-engine.ts`) & API (`/api/skeu/reconciliation/run`).
- [x] F3: Management Pagu Anggaran Unit/Prodi & Approval Yayasan (`/api/skeu/budget`).

---

## ✅ HRIS Platform — SDM, Dosen NIDN, PPh21 TER & Payroll (SELESAI)
- [x] H1: Calculator Engine (`lib/payroll-calculator.ts`) — PPh21 TER (PMK 168/2023), BPJS Kesehatan (1%), & BPJS TK (3%).
- [x] H2: 5-Step Payroll Engine (`lib/payroll-engine.ts`) — Sequential execution (Persiapan $\rightarrow$ Absensi $\rightarrow$ Kalkulasi $\rightarrow$ Approval $\rightarrow$ Disburse).
- [x] H3: API Employees (`/api/employees`) & Payroll Run (`/api/payroll/run`).
- [x] H4: API Approval Berjenjang (`/api/payroll/approve`) & Webhook Disburse ke SKEU Keuangan (`/api/payroll/disburse-to-skeu`).

---

## ✅ Bank Konten Platform — Repositori Soal CBT, Taksonomi Bloom & Provider API (SELESAI)
- [x] B1: Quiz Generator Engine (`lib/quiz-generator.ts`) — Randomization paket soal dengan filter Taksonomi Bloom C1-C6 & Tingkat Kesulitan.
- [x] B2: Item Analysis Engine (`lib/item-analysis.ts`) — Analisis Daya Beda & Correct Rate butir soal.
- [x] B3: API Management Bank Soal (`/api/questions`) & Provider Export CBT ke PMB (`/api/export/pmb-cbt`).

---

## ✅ Performance & Security Hardening (SELESAI)
- [x] P1: SSO JWKS Cache Manager (`sso-platform/lib/jwks-cache.ts`) — In-memory caching kunci publik SSO dengan TTL 1 jam & key rotation fallback.
- [x] P2: SIAKAD Query Cache Manager (`siakad-platform/lib/query-cache.ts`) — Caching metadata periode akademik, prodi, dan tarif SPP/UKT.
- [x] P3: Rate Limiter & Anti-Spam Throttler (`keuangan-platform/lib/rate-limiter.ts`) — Sliding window rate limiter membatasi 10 req/menit pada webhook & API sensitif.






