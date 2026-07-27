# Rencana Implementasi Fase 2 — Beasiswa, PMB Sync, Wisuda

## Informasi Dokumen
| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Terkait | BRD-Keuangan-UNSIA.md, PRD-Keuangan-UNSIA.md, Plan-Keuangan-UNSIA.md |
| Tech Stack | Next.js (App Router), Drizzle ORM, PostgreSQL |
| Status | ✅ Fase 1 selesai — memulai Fase 2 |

---

## 1. Ringkasan Fase 2

| Epic | Fitur | FR Reference |
|---|---|---|
| **Epic F** | Beasiswa & Keringanan | FR-4 |
| **Epic G** | Penerimaan PMB Sync | FR-3 |
| **Epic H** | Wisuda & Kegiatan Berbayar | FR-5 |

---

## 2. Epic F — Beasiswa & Keringanan (FR-4)

### F1 — Schema Beasiswa
File: `db/schema/scholarship.ts` (NEW)
- `scholarshipPrograms`: kode, nama, sumberDana (KIP-K/Internal/Mitra), kuota, nominalPerSemester, status
- `scholarshipRecipients`: programId, studentUserId, periode, nominal, status (aktif/selesai/dicabut)
- `scholarshipDisbursements`: programId, sumberDana, jumlah, tanggalCair, rekeningTujuan, keterangan

### F2 — API CRUD Program Beasiswa
- `app/api/skeu/scholarships/route.ts` — GET (list), POST (create)
- `app/api/skeu/scholarships/[id]/route.ts` — GET (detail), PUT (update), DELETE

### F3 — API Pembebanan Beasiswa ke Tagihan
- `app/api/skeu/scholarships/apply/route.ts` — POST: bebankan beasiswa ke tagihan mahasiswa per periode
- Mengupdate `studentInvoiceItems` dengan `scholarshipRecipientId`
- Mengupdate status tagihan menjadi "beasiswa" jika lunas penuh, atau "cicilan" jika sisa

### F4 — API Pengajuan Keringanan (mahasiswa)
- `app/api/skeum/relief/request/route.ts` — POST: ajukan keringanan/cicilan
- Reuse tabel `installmentPlans` + `installmentTerms` yang sudah ada

### F5 — API Approval Keringanan (admin)
- `app/api/skeu/relief/approvals/route.ts` — GET (list pengajuan), POST (setuju/tolak)

### F6 — UI Admin Beasiswa
- Tab "beasiswa" di SKEU: daftar program, CRUD, daftar penerima, pembebanan

### F7 — UI SKEUM Pengajuan Keringanan
- Form pengajuan cicilan/keringanan dengan upload dokumen

---

## 3. Epic G — Penerimaan PMB Sync (FR-3)

### G1 — Schema PMB Funnel
File: `db/schema/pmb.ts` (enhance)
- Tambah `pmbApplicants` (sinkron dari SI-PMB): id, userId, nama, gelombang, statusPendaftaran, statusPembayaran per tahap

### G2 — API Funnel PMB
- `app/api/skeu/pmb/funnel/route.ts` — GET: ringkasan funnel konversi
- `app/api/skeu/pmb/applicants/route.ts` — GET: daftar pendaftar

### G3 — UI Dashboard PMB
- Tab/Page baru di SKEU: ringkasan gelombang, funnel, daftar pendaftar

---

## 4. Epic H — Wisuda & Kegiatan Berbayar (FR-5)

### H1 — Schema Event
File: `db/schema/events.ts` (NEW)
- `paidEvents`: nama, targetPendapatan, estimasiPengeluaran, proyeksiSurplus, status, tanggalMulai, tanggalSelesai
- `eventFeeComponents`: eventId, namaKomponen, nominal
- `eventRegistrations`: eventId, studentUserId, invoiceId, status (terdaftar/lunas/batal)

### H2 — API CRUD Event + Generate Tagihan
- `app/api/skeu/events/route.ts` — GET, POST
- `app/api/skeu/events/[id]/route.ts` — GET, PUT, DELETE
- `app/api/skeu/events/[id]/generate-invoices/route.ts` — POST: generate tagihan massal

### H3 — UI Event Wisuda
- Tab/page baru di SKEU: daftar event, create event, detail, generate tagihan

---

## 5. Sprint Plan

### Sprint 1 — Beasiswa & Keringanan
| Task | File | Estimasi |
|---|---|---|
| F1: Schema beasiswa | `db/schema/scholarship.ts` | 1 hari |
| F2: API CRUD beasiswa | `app/api/skeu/scholarships/` | 1 hari |
| F3: API pembebanan beasiswa | `app/api/skeu/scholarships/apply` | 1 hari |
| F4: API pengajuan keringanan | `app/api/skeum/relief/request` | 1 hari |
| F5: API approval keringanan | `app/api/skeu/relief/approvals` | 1 hari |
| F6: UI Admin Beasiswa | `app/skeu/` (tab beasiswa) | 2 hari |
| F7: UI SKEUM keringanan | `app/skeum/pengajuan/` | 1 hari |
| **Total Sprint 1** | | **8 hari** |

### Sprint 2 — PMB Sync + Wisuda
| Task | File | Estimasi |
|---|---|---|
| G1: Schema PMB funnel | `db/schema/pmb.ts` enhance | 0.5 hari |
| G2: API Funnel PMB | `app/api/skeu/pmb/` | 1 hari |
| G3: UI Dashboard PMB | `app/skeu/pmb/` | 1 hari |
| H1: Schema Event | `db/schema/events.ts` | 0.5 hari |
| H2: API Event | `app/api/skeu/events/` | 1.5 hari |
| H3: UI Event | `app/skeu/events/` | 1.5 hari |
| **Total Sprint 2** | | **6 hari** |

---

## 6. Prioritas Implementasi

1. **Pertama: Beasiswa & Keringanan** — dampak langsung ke mahasiswa yang sudah transaksi di SKEUM sejak Fase 1
2. **Kedua: PMB Sync** — melengkapi data penerimaan yang sudah mulai masuk di modul PMB
3. **Ketiga: Wisuda** — fitur musiman, bisa menyusul setelah beasiswa & PMB stabil
