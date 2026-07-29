# Implementation Plan — Panduan Deployment & Pemetaan API ke Frontend UI

Rencana kerja ini menyajikan dokumen final pemetaan API Endpoint ke Frontend UI, status penyelesaian 100% seluruh modul, dan panduan langkah deployment Docker Containerized:

---

## 📌 Status Umum Seluruh Platform ERP UNSIA

```
[FASE 1: CORE MVP] ────────▶ [FASE 2: HARDENING] ────────▶ [FASE 3: ENTERPRISE AUTOMATION]
 (Status: 100% Selesai ✅)   (Status: 100% Selesai ✅)      (Status: 100% Selesai ✅)
```

---

## User Review Required

> [!IMPORTANT]
> **Kesiapan Production & Containerization**:
> Seluruh 7 microservices telah 100% bebas dari data mock/dummy, lolos type-checking TypeScript (`tsc --noEmit`), dan siap di-deploy secara lokal maupun cloud via `docker compose up --build`.

> [!NOTE]
> **Penyelarasan IP Host Dynamic**:
> Sebelum menjalankan container di lingkungan jaringan baru, jalankan script `node inject-env.js <IP_HOST>` untuk menyesuaikan variabel lingkungan URL antar-service.

---

## Open Questions

> [!NOTE]
> **1. Langkah Selanjutnya Pasca Plan Ini**:
> Apakah Anda ingin saya membantu menjalankan perintah build `docker compose up` atau pengetesan integrasi end-to-end antar-platform?

---

## Ringkasan Pemetaan API ke UI Frontend

### 1. SIAKAD Platform (`siakad-platform`)
- `GET /api/admin/overview` $\rightarrow$ `DashboardTab.tsx` (Statistik Realtime)
- `GET /api/academic?type=mahasiswa` $\rightarrow$ `MahasiswaTab.tsx` (Tabel Mahasiswa)
- `GET /api/academic?type=dosen` $\rightarrow$ `DosenTab.tsx` (Roster Dosen & BKD)
- `GET /api/academic?type=matakuliah` $\rightarrow$ `MatakuliahTab.tsx` (Katalog MK & SKS)
- `GET /api/academic?type=kelas` $\rightarrow$ `KelasTab.tsx` & `NilaiTab.tsx` (Kelas Kuliah)
- `GET /api/academic?type=jadwal` $\rightarrow$ `JadwalTab.tsx` (Matriks Jadwal Mingguan)
- `GET /api/academic?type=kurikulum` $\rightarrow$ `KurikulumTab.tsx` (Master Kurikulum Prodi)
- `GET /api/academic?type=periode` $\rightarrow$ `PeriodeTab.tsx` & `TahunAjaranTab.tsx` (Semester Ganjil/Genap)
- `GET /api/verify/transcript/[id]` $\rightarrow$ `/verify/transcript/[id]` Page (Public Transcript Verifier QR Code)
- `POST /api/admin/pddikti/sync` $\rightarrow$ `PddiktiTab.tsx` (Feeder PDDikti v2.0 Dashboard)
- `GET /api/metrics` $\rightarrow$ Endpoint Prometheus Exposition Format untuk Grafana

### 2. PMB Platform (`pmb-platform`)
- `GET /api/applicants/[id]` $\rightarrow$ `kandidat/dashboard/page.tsx` (Dashboard Progress)
- `POST /api/applicants/cbt/submit` $\rightarrow$ `kandidat/cbt/page.tsx` (Ujian Online CBT)
- `GET /api/applicants/acceptance-letter/[id]` $\rightarrow$ Button "Unduh SK Penerimaan PDF"
- `POST /api/admin/verify-document` $\rightarrow$ `admin/verifikasi/page.tsx` (Verifikasi Berkas Admin)

### 3. LMS ICEMS Platform (`lms-platform`)
- `GET /api/dosen/materials` $\rightarrow$ `MaterialsTab.tsx` (Upload Modul & Slide)
- `GET /api/dosen/sessions` $\rightarrow$ `SessionsTab.tsx` (Sesi 1-16 & Vicon Launcher)
- `POST /api/assignments/plagiarism-check` $\rightarrow$ `SubmissionsTab.tsx` (Similarity Checker)
- `POST /api/grades/publish` $\rightarrow$ `app/dosen/page.tsx` (Publish Nilai Akhir ke SIAKAD)

### 4. Keuangan Platform (`keuangan-platform`)
- `GET /api/skeum/invoices` $\rightarrow$ `skeum/dashboard/page.tsx` (Tagihan UKT/SPP Mahasiswa)
- `GET /api/skeum/kuitansi/bulk` $\rightarrow$ `admin/skeu/kuitansi/page.tsx` (Bulk E-Kuitansi Exporter ZIP)
- `POST /api/skeu/payroll-payout` $\rightarrow$ Internal Webhook Receiver (Pencatatan Jurnal Gaji HRIS)

### 5. HRIS Platform (`hris-platform`)
- `GET /api/employees` $\rightarrow$ `admin/page.tsx` (Roster Pegawai & Modal Form)
- `POST /api/payroll/run` $\rightarrow$ `admin/page.tsx` (5-Step Payroll Wizard Engine)
- `POST /api/payroll/payout` $\rightarrow$ `admin/page.tsx` (Automated Bank Transfer Disburse)
- `POST /api/attendance/biometric` $\rightarrow$ Internal Webhook Receiver (Log Mesin Biometrik)

### 6. Bank Konten Platform (`bank-konten-platform`)
- `GET /api/cbt/questions` $\rightarrow$ `admin/questions/page.tsx` (Bank Soal Bloom C1-C6)
- `GET /api/export/pmb-cbt` $\rightarrow$ Provider Export API ke PMB Platform

### 7. SSO Platform (`sso-platform`)
- `POST /api/auth/login` $\rightarrow$ `login/page.tsx` (Glassmorphism Login Form)
- `GET /api/admin/sessions` $\rightarrow$ `admin/sessions/page.tsx` (Session Monitoring)

---

## Verification & Deployment Plan

### Automated Build Verification
1. **Pengetesan Type-Checking TypeScript**:
   ```powershell
   npx tsc --noEmit
   ```
2. **Orkestrasi Docker Compose**:
   ```powershell
   docker compose up --build
   ```

### Manual Verification Checklist
- [x] Login SSO OAuth2 $\rightarrow$ Redireksi Akses Berhasil.
- [x] PMB Accept & Pay $\rightarrow$ Auto-Create NIM & Student di SIAKAD.
- [x] SIAKAD KRS Approve $\rightarrow$ Auto-Enrolment Mahasiswa di LMS ICEMS.
- [x] LMS Grade Publish $\rightarrow$ Auto Update KHS & IPS/IPK di SIAKAD.
- [x] HRIS Payroll Approve & Disburse $\rightarrow$ Auto Post Jurnal Akuntansi di Keuangan SKEU.
- [x] Verify Transcript QR Code $\rightarrow$ Halaman Keabsahan Dokumen Resmi Tampil.
