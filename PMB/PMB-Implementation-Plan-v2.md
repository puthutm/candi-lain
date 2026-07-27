# Rencana Implementasi Sistem Informasi PMB UNSIA

| Metadata | Detail |
|---|---|
| Nama Proyek | Sistem Informasi Penerimaan Mahasiswa Baru (SI-PMB) UNSIA |
| Tech Stack | Next.js 16 (App Router), Drizzle ORM, PostgreSQL, TypeScript |
| Status | Fase 1 (MVP) - Sedang Berjalan |
| Dokumen Terkait | BRD-SI-PMB-UNSIA.md, PRD-SI-PMB-UNSIA.md, ERD-SI-PMB-UNSIA.mermaid, Flow-Bisnis-SI-PMB-UNSIA.mermaid |
| Dependensi Eksternal | SSO Platform (untuk login staf Admin PMB), Payment Gateway (Midtrans/Xendit) |

---

## 1. Arsitektur Sistem

### 1.1 Aplikasi Front-End

| Aplikasi | Route | Status |
|---|---|---|
| **Portal Publik** | `/` | ✅ Landing page & wizard pendaftaran |
| **Dashboard Pendaftar** | `/dashboard` | ✅ Tagihan, data diri, berkas, ujian, pengumuman |
| **Ujian CBT** | `/exam` | ✅ Modul ujian dengan timer & auto-save |
| **Admin PMB** | `/admin` | ✅ Beranda, Monitoring, Pendaftar, Verifikasi, Pembayaran, Komunikasi, Gelombang, Pengaturan |

### 1.2 API Endpoints

| Grup | Endpoint | Status |
|---|---|---|
| **Meta Data** | `/api/meta` | ✅ Gelombang, jalur, prodi, kuota |
| **Pendaftar** | `/api/applicants`, `/api/applicants/[id]`, `/api/applicants/login`, `/api/applicants/profile`, `/api/applicants/documents` | ✅ CRUD lengkap |
| **Auth** | `/api/auth/[...nextauth]`, `/api/auth/callback`, `/api/auth/session`, `/api/auth/logout` | ✅ SSO & local auth |
| **Pembayaran** | `/api/invoices`, `/api/invoices/pay`, `/api/payment/webhook`, `/api/payment/create-transaction`, `/api/payment/channels` | ✅ Termasuk gateway registry |
| **Admin** | `/api/admin/gelombang`, `/api/admin/kuota`, `/api/admin/invoices`, `/api/admin/stats`, `/api/admin/blast`, `/api/admin/templates` | ✅ Panel admin lengkap |
| **Ujian** | `/api/exam/modules`, `/api/exam/questions`, `/api/exam/submit`, `/api/exam/log-violation` | ✅ CBT engine |
| **Lainnya** | `/api/seed`, `/api/health` | ✅ Seeding & health check |

---

## 2. Database Schema (Drizzle ORM)

| Modul | Tabel | Status |
|---|---|---|
| **Master** | `pmbWaves`, `pmbEntryPaths`, `pmbStudyPrograms`, `pmbQuotas` | ✅ |
| **Pendaftar** | `pmbApplicants`, `pmbApplicantProfiles`, `pmbDocumentTypes`, `pmbApplicantDocuments`, `pmbApplicantStatusHistory` | ✅ |
| **Pembayaran** | `pmbInvoices`, `pmbPaymentTransactions` | ✅ (termasuk idempotencyKey) |
| **Ujian** | `pmbExamModules`, `pmbExamSessions`, `pmbExamQuestions`, `pmbExamAnswers`, `pmbExamResults` | ✅ |
| **Komunikasi** | `pmbMessageTemplates`, `pmbCampaigns`, `pmbAutomationWorkflows`, `pmbMessageLogs` | ✅ |

---

## 3. Status Implementasi per Sprint

### Sprint 0: Foundation ✅ (Selesai)
- Setup environment variables & config
- Generate & run migrasi Drizzle
- Seed data production-ready
- Build berhasil tanpa error

### Sprint 1: Admin Panel - Pembayaran & Pengaturan ✅ (Selesai)
- ✅ Panel Pembayaran: tabel transaksi, filter status, ringkasan KPI
- ✅ Panel Pengaturan: 4 section (Umum, Pembayaran, Notifikasi, Ujian CBT)
- ✅ API endpoint admin invoices
- ✅ Build verified

### Sprint 2: Payment Gateway Integration ✅ (Selesai)
- ✅ Schema: idempotencyKey di pmbPaymentTransactions
- ✅ Lib: Payment gateway types & interfaces (`lib/payment/gateway-types.ts`)
- ✅ Lib: Midtrans provider (`lib/payment/midtrans-provider.ts`)
- ✅ Lib: Gateway registry dengan simulated fallback (`lib/payment/gateway-registry.ts`)
- ✅ API: Update webhook handler dengan idempotensi & gateway registry
- ✅ API: `POST /api/payment/create-transaction`
- ✅ API: `GET /api/payment/channels`
- ✅ Build: Compiled successfully, TypeScript passed
- ⬜ Dashboard: Update UI metode pembayaran dari gateway API (lanjutan)

### Sprint 3: Notifikasi & Komunikasi ✅ (Selesai)
- ✅ Integrasi Email (Nodemailer/SendGrid) - `lib/email.ts`
- ✅ Integrasi WhatsApp API - `lib/whatsapp.ts`
- ✅ Automation Workflows engine - `lib/automation.ts`
- ✅ API Message Templates - CRUD template + workflow seed
- ✅ API Blast - kirim notifikasi massal dengan segment filter
- ✅ Seed workflows default (Welcome, Payment Reminder, Payment Confirmed, Documents Verified/Revision, Acceptance Letter, Rejection)
- ✅ Build: Compiled successfully, TypeScript passed

### Sprint 4: SSO Dynamic Roles & Security (Sedang Berjalan)
- ⬜ Integrasi dynamic roles dari SSO Platform
- ⬜ Role-based access control di Admin PMB
- ⬜ Enkripsi dokumen & signed URL untuk akses
- ⬜ Audit log lengkap (semua perubahan status tercatat)

### Sprint 5: Penyempurnaan CBT & Funnel (Belum Dimulai)
- ⬜ CRUD Gelombang penuh (create, update, delete)
- ⬜ CRUD Kuota penuh per prodi
- ⬜ Monitoring Funnel - filter per gelombang
- ⬜ Insight drop-off otomatis
- ⬜ CBT - retake policy

### Sprint 6: Testing & Hardening (Belum Dimulai)
- ⬜ Test wizard pendaftaran (edge case validasi, submit ganda)
- ⬜ Test idempotensi webhook (hindari duplikasi status lunas)
- ⬜ Security test dokumen (URL tidak bisa diakses publik)
- ⬜ Load test (simulasi traffic tinggi deadline gelombang)
- ⬜ Error handling & logging improvement

### Sprint 7: UAT & Dokumentasi (Belum Dimulai)
- ⬜ UAT bersama panitia PMB (Verifikator, Staff Keuangan, Super Admin)
- ⬜ Dokumentasi pengguna (user manual admin & pendaftar)
- ⬜ Deployment production (Docker, CI/CD, monitoring)
- ⬜ Go-Live

---

## 4. Detail File Implementasi

### 4.1 Payment Gateway (Sprint 2)

| File | Deskripsi |
|---|---|
| `lib/payment/gateway-types.ts` | Interface `PaymentGatewayProvider`, `PaymentChannel`, `CreateTransactionRequest/Response`, `GatewayWebhookPayload` |
| `lib/payment/midtrans-provider.ts` | Implementasi provider Midtrans (Snap API, signature verification, webhook parsing) |
| `lib/payment/gateway-registry.ts` | Registry pattern: SimulatedProvider (fallback) + MidtransProvider, singleton instance |
| `app/api/payment/create-transaction/route.ts` | POST endpoint: create transaksi via gateway aktif dengan idempotency |
| `app/api/payment/channels/route.ts` | GET endpoint: list metode pembayaran dari gateway aktif |
| `app/api/payment/webhook/route.ts` | POST endpoint: handle webhook dengan signature verification & idempotensi |

### 4.2 Komunikasi (Sprint 3 - akan dibuat)

| File | Deskripsi |
|---|---|
| `lib/email.ts` | Nodemailer/SendGrid email sender |
| `lib/whatsapp.ts` | WhatsApp Business API/Fonnte/Wablas integration |
| `lib/automation.ts` | Workflow engine: trigger-based automation (form submitted, payment confirmed, etc.) |
| `app/api/admin/templates/[id]/route.ts` | CRUD message template (sudah ada skeleton) |
| `app/api/admin/automation/route.ts` | CRUD automation workflow |

### 4.3 SSO & Security (Sprint 4 - akan dibuat)

| File | Deskripsi |
|---|---|
| `lib/sso-middleware.ts` | Dynamic role integration dengan SSO Platform |
| `lib/document-security.ts` | Encrypted document storage & signed URL generation |
| `app/api/applicants/audit/route.ts` | Audit trail API |

---

## 5. Alur Bisnis Utama

```
Portal Publik → Wizard Pendaftaran (4 Langkah)
    ↓
Dapat No. Pendaftaran + Welcome Email
    ↓
Login Dashboard Pendaftar → Lihat Tagihan → Pilih Metode Bayar
    ↓
[Payment Gateway: Midtrans / Simulated]
    ↓
Webhook → Update Status Lunas → Buka Akses Biodata & Unggah Berkas
    ↓
Unggah Berkas → Antrean Verifikasi
    ↓
[Verifikator: Approve / Revisi]
    ↓
Berkas Lengkap + Lunas → Siap Ujian CBT
    ↓
Kerjakan CBT (5 Modul, Timer, Auto-save)
    ↓
[Admin: Nilai → Keputusan Lulus / Tidak Lulus]
    ↓
Pendaftar Lihat Hasil Akhir di Dashboard
```

---

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| SSO Platform belum siap | Admin PMB tak bisa login | Siapkan stub/mock auth sementara |
| Payment gateway belum diputuskan | Epic D3/E4 tertunda | Gunakan simulated provider sebagai fallback |
| Duplikasi status lunas akibat webhook ganda | Sedang | Idempotency key pada payment_transactions ✅ |
| Dokumen sensitif bocor via URL publik | Tinggi | Signed URL berbatas waktu (Sprint 4) |
| Lonjakan trafik deadline gelombang | Sedang | Load test di Sprint 6 |

---

## 7. Timeline Estimasi (13-14 Minggu)

| Sprint | Durasi | Status |
|---|---|---|
| **Sprint 0**: Foundation | 1 minggu | ✅ Selesai |
| **Sprint 1**: Admin Panel | 2 minggu | ✅ Selesai |
| **Sprint 2**: Payment Gateway | 2 minggu | ✅ Selesai |
| **Sprint 3**: Notifikasi & Komunikasi | 2 minggu | ⬜ Belum Dimulai |
| **Sprint 4**: SSO & Security | 2 minggu | ⬜ Belum Dimulai |
| **Sprint 5**: CBT & Funnel | 2 minggu | ⬜ Belum Dimulai |
| **Sprint 6**: Testing & Hardening | 2 minggu | ⬜ Belum Dimulai |
| **Sprint 7**: UAT & Go-Live | 2 minggu | ⬜ Belum Dimulai |

---

## 8. Catatan Penting

### 8.1 Keputusan Bisnis yang Masih Tertunda
1. **Payment Gateway**: Midtrans / Xendit? (Sprint 2 menggunakan simulated + Midtrans provider siap)
2. **Provider WhatsApp**: WhatsApp Business API / Fonnte / Wablas?
3. **Kebijakan Retake Ujian**: Berapa kali boleh mengulang?
4. **Kebutuhan Wawancara**: Apakah ada tahap interview untuk jalur tertentu?

### 8.2 Dependensi Kritis
- **Sprint 4** (SSO Dynamic Roles) memerlukan SSO Platform sudah live di staging
- **Sprint 2** payment gateway bisa jalan dengan simulated provider tanpa gateway sungguhan
- **Sprint 3** notifikasi bisa mulai dengan email (SMTP) tanpa WhatsApp

### 8.3 Build Status Saat Ini
- ✅ `npm run build` - Compiled successfully
- ✅ TypeScript passed tanpa error
- ✅ Semua 40+ route terdaftar
- ✅ Tidak ada dependency baru yang perlu diinstall
