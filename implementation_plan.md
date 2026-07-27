# Implementation Plan — Penyelesaian Modul Keuangan UNSIA (SKEU & SKEUM)

Rencana implementasi ini berfokus pada penyelesaian item tersisa di Modul Keuangan (Fase 1 MVP) sesuai target di `TODO.md` dan `Plan-Keuangan-UNSIA.md`:
1. **Generator E-Kuitansi PDF Resmi Mahasiswa (Epic D3)**: Endpoint & antarmuka unduh e-kuitansi pembayaran UKT/SPP resmi ber-watermark dengan QR Code keabsahan di Portal SKEUM.
2. **UI Monitoring Clearance Finansial Admin (Epic E5)**: Panel pemantauan status clearance mahasiswa (`aktif` vs `tertahan`), deteksi tunggakan, dan tombol manual override clearance.
3. **Workflow Approval Yayasan untuk Tarif SPP/UKT (Epic B5)**: Status persetujuan berjenjang perubaham tarif prodi (`draf` $\rightarrow$ `menunggu_yayasan` $\rightarrow$ `disetujui`) sebelum dipublikasikan untuk auto-invoicing.

---

## User Review Required

> [!IMPORTANT]
> **Otorisasi Approval Tarif Yayasan**:
> Perubahan tarif SPP/UKT prodi hanya dapat disetujui oleh pengguna dengan role SSO `kepala_biro` atau `pengurus_yayasan`. Tarif yang masih berstatus `draf` tidak akan digunakan saat penagihan massal (`generate invoices`).

> [!NOTE]
> **Fitur E-Kuitansi Mahasiswa**:
> E-Kuitansi PDF dapat langsung diakses oleh mahasiswa di portal SKEUM setelah status transaksi berstatus `paid` (lunas).

---

## Open Questions

> [!NOTE]
> **1. Penomoran E-Kuitansi Resmi**:
> Apakah penomoran e-kuitansi menggunakan format `{tahun}/KWI-UNSIA/{nomor_invoice}` (contoh: `2026/KWI-UNSIA/INV-202605-001`) atau penomoran berurutan khusus kuitansi terpisah?

---

## Proposed Changes

### 1. Generator E-Kuitansi PDF Resmi Mahasiswa (`keuangan-platform/app/api/skeum`)

---

#### [NEW] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/app/api/skeum/kuitansi/[id]/route.ts)
- Endpoint generator HTML/PDF E-Kuitansi Pembayaran resmi UNSIA dengan rincian invoice, rincian biaya, tanggal lunas, dan QR Code verifikasi.

#### [NEW] [page.tsx](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/app/skeum/page.tsx)
- UI Portal Keuangan Mahasiswa (SKEUM): Tampilan tagihan aktif, status clearance finansial, riwayat transaksi lunas, dan tombol unduh E-Kuitansi.

---

### 2. UI Monitoring Clearance Finansial Admin (`keuangan-platform/app/admin`)

---

#### [NEW] [page.tsx](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/app/admin/clearance/page.tsx)
- UI Dashboard Clearance Admin: Pemantauan daftar mahasiswa berstatus `tertahan` (overdue), filter prodi/angkatan, dan fitur manual override clearance.

---

### 3. Workflow Approval Yayasan untuk Master Tarif (`keuangan-platform/app/api/skeu`)

---

#### [NEW] [route.ts](file:///d:/Superman/Superman/Coding/candi/candi-lain/keuangan-platform/app/api/skeu/tuition-rates/approve/route.ts)
- Endpoint pengajuan & persetujuan perubahan tarif SPP/UKT oleh Biro Keuangan & Yayasan.

---

## Verification Plan

### Manual Verification
1. **Pengujian Portal SKEUM & E-Kuitansi PDF**:
   - Login Portal Mahasiswa SKEUM -> Lihat tagihan lunas -> Klik "Unduh E-Kuitansi" -> Pastikan dokumen kuitansi resmi dengan QR Code dan rincian transaksi tampil sempurna.
2. **Pengujian Clearance Finansial Admin**:
   - Buka Admin SKEU -> Tab Clearance -> Verifikasi mahasiswa dengan tagihan jatuh tempo terdeteksi `tertahan` -> Uji fitur override manual -> Pastikan status di SIAKAD ter-sync otomatis.
3. **Pengujian Approval Tarif Yayasan**:
   - Buat tarif SPP/UKT baru (status `draf`) -> Lakukan pengajuan approval -> Login sebagai `kepala_biro` / Yayasan -> Setujui tarif -> Pastikan tarif `disetujui` aktif digunakan pada penagihan massal.
