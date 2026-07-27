# Rencana Implementasi Modul Keuangan UNSIA — SKEU & SKEUM

## Informasi Dokumen
| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | Berdasarkan analisis BRD/PRD/ERD/Flow/Plan yang ada |
| Terkait | BRD-Keuangan-UNSIA.md, PRD-Keuangan-UNSIA.md, ERD-Keuangan-UNSIA.mermaid, Flow-Bisnis-Keuangan-UNSIA.mermaid, Plan-Keuangan-UNSIA.md |
| Tech Stack | Next.js (App Router), Drizzle ORM, PostgreSQL |
| Status | ✅ Plan disetujui — implementasi Fase 1 dimulai |

---

## 1. Gap Analysis (Kondisi Saat Ini vs Target)

### ✅ Sudah Ada di `keuangan-platform/`
| Komponen | Detail |
|---|---|
| **DB Schema** | `tuitionRates`, `chartOfAccounts`, `studentInvoices`, `studentInvoiceItems`, `payments`, `financeClearanceStatus`, `siakadStudyPrograms`, `siakadStudents` |
| **API Routes** | tuition-rates (POST/PUT), coa (GET), skeu/data, skeum/data, skeum/pay, skeum/simulate-pay, admin/clearance, webhooks/payment, sync/siakad, auth (login/logout/session) |
| **Halaman** | SKEU (admin), SKEUM (mahasiswa), Login, Error |
| **Library** | auth.ts, client-config.ts, env.ts |

### ❌ Belum Ada (Perlu Dibangun)
| Area | Entitas/Schema | API | UI |
|---|---|---|---|
| **Master** | scholarshipPrograms, scholarshipRecipients, pmbFeeRates | ✗ | ✗ |
| **Cicilan** | installmentPlans, installmentTerms | ✗ | ✗ |
| **Pengeluaran** | purchaseOrders, poApprovals, paymentsOut, externalHonorariums, payrollDisbursements, payrollDisbursementItems, referralDisbursements | ✗ | ✗ |
| **Kas/Bank** | bankAccounts, bankMutations, internalTransfers | ✗ | ✗ |
| **Pajak** | taxWithholdings, taxReports | ✗ | ✗ |
| **Akuntansi** | journalEntries, journalEntryLines, budgetAllocations | ✗ | ✗ |
| **Governance** | syncLogs, auditLogs | ✗ | ✗ |

---

## 2. Roadmap 4 Fase

### Fase 1 (MVP) — Penerimaan Mahasiswa + SKEUM + Clearance Dasar
**Estimasi: 8 minggu**

| Sprint | Minggu | Fokus | Epic |
|---|---|---|---|
| Sprint 0 | 1 | Foundation Enhancement | A |
| Sprint 1 | 2 | Master Tarif Enhancement | B |
| Sprint 2 | 3-4 | Penerimaan Mahasiswa + SKEUM | C, D |
| Sprint 3 | 5 | SKEUM Lanjutan + Clearance | D, E |
| Sprint 4 | 6 | Clearance + Dashboard | E |
| Sprint 5 | 7 | Testing & Hardening | - |
| Go-Live | 8 | Fase 1 MVP Live | - |

### Fase 2 — Beasiswa, PMB Sync, Wisuda
- Beasiswa & Keringanan (Epic F)
- Penerimaan PMB Sync (Epic G)
- Wisuda & Kegiatan Berbayar (Epic H)

### Fase 3 — Pengeluaran
- Payroll Disbursement (Epic I)
- Purchase Order & Honor (Epic J)
- Komisi Referral CRM (Epic K)

### Fase 4 — Pajak, Akuntansi & Laporan
- Pajak & Kepatuhan (Epic L)
- Akuntansi & Laporan (Epic M)

---

## 3. Detail Fase 1 (MVP)

### Epic A — Foundation & Infrastructure Enhancement
| # | Task | File |
|---|---|---|
| A1 | Tambah schema yang belum ada untuk Fase 1 (installmentPlans, installmentTerms, bankAccounts, bankMutations, journalEntries, journalEntryLines) | `db/schema/` |
| A2 | Setup environment variables Payment Gateway | `.env` |
| A3 | Perkuat SSO roles & middleware | `lib/auth.ts`, `middleware.ts` |
| A4 | Buat payment gateway library (midtrans) | `lib/payment/` |
| A5 | Buat SIAKAD API client | `lib/siakad-client.ts` |

### Epic B — Master Tarif Enhancement
| # | Task | File |
|---|---|---|
| B1 | Tambah GET /api/skeu/tuition-rates (list all) | `app/api/skeu/tuition-rates/route.ts` |
| B2 | Tambah DELETE /api/skeu/tuition-rates/[id] | `app/api/skeu/tuition-rates/[id]/route.ts` |
| B3 | UI CRUD Tarif per Prodi/Periode | `app/skeu/tarif/` |
| B4 | UI Chart of Accounts | `app/skeu/coa/` |
| B5 | Approval workflow Yayasan untuk perubahan tarif | `app/api/skeu/approvals/` |

### Epic C — Penerimaan Mahasiswa (Core)
| # | Task | File |
|---|---|---|
| C1 | Buat schema & API generate tagihan massal | `db/schema/invoices.ts`, `app/api/skeu/invoices/generate/` |
| C2 | API daftar tagihan + filter (prodi, status) | `app/api/skeu/invoices/route.ts` |
| C3 | Perkuat webhook Payment Gateway (idempotency) | `app/api/webhooks/payment/route.ts` |
| C4 | Tombol "Force Re-sync PG" | `app/api/skeu/invoices/resync/` |
| C5 | Dashboard ringkas collection rate | `app/skeu/` |

### Epic D — Portal Mahasiswa (SKEUM Enhancement)
| # | Task | File |
|---|---|---|
| D1 | Beranda SKEUM — tagihan, jatuh tempo, clearance | `app/skeum/page.tsx` |
| D2 | Detail tagihan + checkout VA/QRIS | `app/skeum/tagihan/` |
| D3 | Riwayat transaksi + e-kuitansi | `app/skeum/riwayat/` |
| D4 | SSO login + navigasi ke induk | `app/skeum/layout.tsx` |

### Epic E — Status Clearance Finansial
| # | Task | File |
|---|---|---|
| E1 | Cron/job deteksi overdue → clearance = tertahan | `app/api/cron/clearance/` |
| E2 | Publish event ke SIAKAD | `lib/siakad-client.ts` |
| E3 | Publish event ke LMS | `app/api/sync/lms/` |
| E4 | Reversal otomatis saat bayar lunas | `app/api/webhooks/payment/route.ts` |
| E5 | UI Status Clearance di Admin | `app/skeu/clearance/` |

---

## 4. Struktur File Target (Fase 1)

```
keuangan-platform/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── clearance/route.ts          # E1
│   │   ├── skeu/
│   │   │   ├── tuition-rates/
│   │   │   │   ├── route.ts                 # B1 (enhance)
│   │   │   │   └── [id]/route.ts            # B2
│   │   │   ├── coa/route.ts                 # B4
│   │   │   ├── approvals/route.ts           # B5
│   │   │   ├── invoices/
│   │   │   │   ├── route.ts                 # C2
│   │   │   │   ├── generate/route.ts        # C1
│   │   │   │   └── resync/route.ts          # C4
│   │   │   ├── clearance/route.ts           # E5
│   │   │   └── stats/route.ts              # C5
│   │   ├── skeum/
│   │   │   ├── data/route.ts               # D1
│   │   │   ├── pay/route.ts                # D2
│   │   │   ├── history/route.ts            # D3
│   │   │   └── receipt/route.ts            # D3
│   │   ├── sync/
│   │   │   ├── siakad/route.ts             # E2
│   │   │   └── lms/route.ts                # E3
│   │   └── webhooks/
│   │       └── payment/route.ts             # C3 (enhance)
│   ├── skeu/
│   │   ├── page.tsx                         # C5 Dashboard
│   │   ├── tarif/page.tsx                  # B3
│   │   ├── coa/page.tsx                    # B4
│   │   ├── invoices/page.tsx               # C2
│   │   └── clearance/page.tsx              # E5
│   └── skeum/
│       ├── page.tsx                         # D1
│       ├── tagihan/[id]/page.tsx           # D2
│       └── riwayat/page.tsx                # D3
├── db/
│   └── schema/
│       ├── index.ts                        # A1 (update)
│       ├── master.ts                       # A1 (update)
│       ├── invoices.ts                     # A1 (update)
│       ├── clearance.ts                    # A1 (update)
│       ├── accounting.ts                   # A1 NEW
│       ├── installment.ts                  # A1 NEW
│       └── bank.ts                         # A1 NEW
├── lib/
│   ├── payment/
│   │   ├── gateway-types.ts                # A4
│   │   ├── midtrans-provider.ts            # A4
│   │   └── gateway-registry.ts             # A4
│   └── siakad-client.ts                    # A5
└── middleware.ts                            # A3
```

---

## 5. Prioritas Implementasi

Urutan implementasi berdasarkan dependensi dan nilai bisnis:

1. ✅ **Sprint 0**: A1 (Schema lengkap) → A4 (Payment lib) → A5 (SIAKAD client) → A3 (SSO roles)
2. ✅ **Sprint 1**: B1-B5 (Master Tarif + CoA + Approval)
3. ✅ **Sprint 2**: C1-C4 (Generate tagihan, Daftar, Webhook, Resync) + D1-D2 (Beranda SKEUM, Checkout)
4. ✅ **Sprint 3**: D3-D4 (Riwayat, SSO) + E1-E2 (Clearance trigger, Event SIAKAD)
5. ✅ **Sprint 4**: E3-E5 (Event LMS, Reversal, UI Clearance) + C5 (Dashboard)
6. ✅ **Sprint 5**: Testing & Hardening
7. ✅ **Sprint 6**: Go-Live Fase 1

---

## 6. Definisi Selesai (DoD) — Fase 1

- [ ] Semua schema database Fase 1 terdefinisi dan termigrasi
- [ ] CRUD Tarif per Prodi/Periode dengan approval Yayasan berfungsi penuh
- [ ] Generate tagihan massal SPP/UKT berjalan otomatis per periode
- [ ] Mahasiswa dapat melihat tagihan, membayar via VA/QRIS, dan melihat riwayat di SKEUM
- [ ] Webhook Payment Gateway bekerja dengan idempotency (tanpa duplikasi)
- [ ] Status clearance finansial berubah otomatis (`aktif` ↔ `tertahan`) sesuai status tagihan
- [ ] Event clearance terkirim ke SIAKAD (dan LMS jika sudah siap)
- [ ] Dashboard admin menampilkan collection rate & outstanding
- [ ] Semua API memiliki role-based access control
