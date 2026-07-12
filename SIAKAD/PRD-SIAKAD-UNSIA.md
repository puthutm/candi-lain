# Product Requirements Document (PRD)
## SIAKAD — Sistem Informasi Akademik Terpadu UNSIA

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL |
| Terkait | SSO Platform (login staf & mahasiswa), SI-PMB UNSIA (sumber calon mahasiswa lulus) |
| Sumber | Reverse-engineering mockup: `Admin_Akademik_UNSIA__BIRO.html` (Admin BAAK + Kaprodi), `SIAKAD_ONBOARDING_PENDAFTAR_MAHASISWA.html`, `SIAKAD_MAHASISWA_PERTAMA_KALI.html`, `Usecase_KRS.html`, `activity_diagram.html`, `Panduan_Pengambilan_KRS.html` |

> ⚠️ **Catatan penting — Gap Desain**: Dari seluruh mockup yang tersedia, **belum ada rancangan antarmuka untuk portal Dosen** (approval KRS sebagai Dosen PA, input nilai, upload materi ajar). Peran ini sudah muncul di proses bisnis (`Usecase_KRS.html`, `activity_diagram.html`) dan direferensikan di sisi Admin/Mahasiswa (mis. status "Menunggu PA", "Dosen Pengampu"), namun UI-nya sendiri belum dibuat. PRD ini tetap mendefinisikan requirement-nya secara fungsional (FR-D) agar scope tidak bolong, dengan status **"UI belum didesain — perlu mockup terpisah"**.

---

## 1. Ringkasan Produk

SIAKAD adalah sistem informasi akademik terpadu yang mengelola siklus akademik mahasiswa UNSIA dari **onboarding pasca-kelulusan PMB** hingga **kelulusan**, terdiri dari 4 kelompok aplikasi:

1. **Portal Onboarding Mahasiswa Baru** (`/siakad/onboarding`) — daftar ulang, pembayaran UKT, penerbitan NIM, KRS perdana, KTM digital.
2. **Portal Mahasiswa Reguler** (`/siakad/mahasiswa`) — dashboard akademik, KRS tiap semester, KHS/transkrip, jadwal & kehadiran, prestasi (SKPI), persuratan mandiri.
3. **Portal Dosen** 🔴 *(requirement didefinisikan, UI belum ada)* — approval KRS sebagai Dosen PA, input nilai, upload materi ajar, rekap BKD pribadi.
4. **Admin Akademik** (`/siakad/admin`) — dua role dalam satu shell (role-switcher): **Admin BAAK** (operasional universitas) dan **Kaprodi** (operasional program studi).

## 2. Problem Statement

Setelah calon mahasiswa dinyatakan lulus seleksi PMB, dibutuhkan sistem terpisah untuk mengelola siklus hidup akademiknya: aktivasi menjadi mahasiswa resmi (NIM, KTM), perencanaan studi berulang tiap semester (KRS dengan validasi prasyarat & approval PA), pengelolaan kelas & dosen, penilaian, hingga pelaporan ke PDDikti — dengan koordinasi yang jelas antara Biro Akademik (kebijakan pusat), Kaprodi (operasional prodi), Dosen (pengajaran & pembimbingan), dan Mahasiswa (pelaksana mandiri).

## 3. Goals & Non-Goals

**Goals**
- Aktivasi mahasiswa baru (dari status "lulus PMB" menjadi mahasiswa aktif ber-NIM) berjalan self-service.
- Pengisian KRS mandiri oleh mahasiswa dengan validasi otomatis (prasyarat, batas SKS berbasis IPS) dan approval Dosen PA.
- Kaprodi & Admin BAAK punya kendali penuh atas kurikulum, penawaran kelas, plotting dosen, dan pemantauan nilai/kehadiran.
- Data akademik siap disinkronkan ke PDDikti (Feeder Kemdikbud) dan LMS.

**Non-Goals (Fase 1)**
- Portal Dosen — **didefinisikan sebagai requirement, namun implementasi UI ditunda** sampai mockup tersedia (lihat catatan gap di atas).
- Proses akreditasi BAN-PT penuh (Fase 1 hanya menyediakan tempat unggah evidence dasar, bukan workflow borang lengkap).
- Engine LMS itu sendiri (Moodle) — SIAKAD hanya terintegrasi via sync, bukan membangun ulang LMS.

## 4. User Roles / Personas

| Peran | Akses | Deskripsi |
|---|---|---|
| **Mahasiswa Baru (Onboarding)** | Portal Onboarding | Lulusan PMB yang belum ber-NIM: bayar UKT → dapat NIM → isi KRS perdana → KTM |
| **Mahasiswa Aktif** | Portal Mahasiswa Reguler | KRS tiap semester, lihat KHS, jadwal, ajukan surat & prestasi |
| **Dosen** 🔴 belum ada UI | Portal Dosen (rencana) | Approve KRS (sbg PA), input nilai, upload materi, lihat BKD |
| **Dosen PA (Pembimbing Akademik)** | subset peran Dosen | Approve/reject pengajuan KRS mahasiswa bimbingannya |
| **Admin BAAK (Kepala Biro Akademik)** | Admin Akademik — seluruh panel, lintas prodi | Kebijakan & operasional akademik tingkat universitas |
| **Kaprodi** | Admin Akademik — panel terbatas ke prodinya | Kurikulum, plotting dosen, monitoring mahasiswa & mutu di prodinya |

> Role Admin BAAK & Kaprodi mengikuti pola **dynamic role per aplikasi** di SSO Platform — "SIAKAD Admin" didaftarkan sebagai satu `application`, dengan `application_roles`: `admin_baak`, `kaprodi`, dan (nanti) `dosen`.

## 5. Functional Requirements

### FR-A. Portal Onboarding Mahasiswa Baru
- FR-A.1 Notifikasi resmi status LULUS dari PMB + roadmap administrasi (Bayar UKT → Penerbitan NIM → Isi KRS Perdana → Cetak KTM).
- FR-A.2 Tagihan Daftar Ulang (UKT Semester 1) dengan batas waktu, pilihan saluran bayar (VA Bank, QRIS/E-Wallet) — pola sama dengan modul pembayaran PMB.
- FR-A.3 Setelah pembayaran terkonfirmasi, sistem **generate NIM otomatis** (format sesuai konfigurasi `Susunan komponen NIM` di Pengaturan) dan mencatat mahasiswa resmi ke PDDikti-ready record.
- FR-A.4 KRS perdana: sistem menampilkan **paket mata kuliah wajib semester 1** (bukan pemilihan bebas), mahasiswa mengajukan ke Dosen PA.
- FR-A.5 Penerbitan KTM digital (kartu identitas dengan QR verifikasi).
- FR-A.6 Setelah seluruh tahap selesai, mahasiswa mendapat akses SSO ke LMS & Portal Mahasiswa Reguler.

### FR-B. Portal Mahasiswa Reguler
- FR-B.1 Dashboard: IPK kumulatif, IPS terakhir, total SKS lulus, jadwal hari ini, pengumuman akademik.
- FR-B.2 Kurikulum Program Studi: distribusi MK per semester + status per MK (sudah/sedang/belum diambil).
- FR-B.3 Pengisian KRS per semester: daftar MK ditawarkan (sesuai kelas dibuka), validasi batas SKS maksimal berbasis IPS terakhir (aturan ambang batas dikonfigurasi Admin), submit → status "Diajukan" menunggu approval Dosen PA.
- FR-B.4 KHS & Transkrip: riwayat nilai per semester, per mata kuliah (huruf, bobot, IPS), cetak/unduh.
- FR-B.5 Jadwal & Kehadiran: jadwal mingguan, akses link Zoom/LMS, rekap kehadiran per MK dengan indikator ambang minimum (≥75%).
- FR-B.6 Aktivitas & Prestasi (SKPI): input prestasi (lomba, organisasi, sertifikasi, publikasi) dengan bukti dokumen → status validasi (menunggu/tervalidasi).
- FR-B.7 Layanan Persuratan Mandiri: ajukan Surat Aktif Kuliah, Transkrip Sementara, Cuti Akademik — status antrian & unduh hasil bertanda tangan digital.

### FR-C. Sistem KRS (Business Logic — lintas portal)
> Berdasarkan `activity_diagram.html` & `Usecase_KRS.html`, ini alur bisnis inti yang melibatkan 4 aktor.

- FR-C.1 **Fase Persiapan**: Admin BAAK setup periode akademik & kurikulum pusat → Kaprodi menentukan penawaran MK (offering) → Kaprodi plot dosen pengampu (sistem cek bentrok jadwal) → sistem publikasi jadwal.
- FR-C.2 **Fase Registrasi**: Mahasiswa isi KRS online → sistem validasi syarat (prasyarat MK lulus, batas SKS) real-time → jika gagal, mahasiswa revisi pilihan.
- FR-C.3 KRS yang valid diajukan ke Dosen PA → Dosen PA approve/reject (dengan catatan wajib jika reject) → jika reject, mahasiswa edit ulang.
- FR-C.4 **Fase Finalisasi**: setelah disetujui PA, sistem generate **Kartu Studi Mahasiswa (KSM)** resmi; kelas ter-update kuota/waitlist-nya.
- FR-C.5 Kaprodi memonitor kelas (kapasitas, waitlist) — dapat override kuota atau membuka kelas paralel otomatis saat waitlist mencapai ambang tertentu.

### FR-D. Portal Dosen 🔴 *(requirement saja, UI belum didesain)*
- FR-D.1 Approval KRS mahasiswa bimbingan (sebagai Dosen PA) — lihat FR-C.3.
- FR-D.2 Input nilai per komponen (tugas, kuis, UTS/UAS, kehadiran) per kelas yang diampu, sesuai bobot komponen yang dikonfigurasi Admin/Kaprodi.
- FR-D.3 Upload materi ajar (dokumen, video, tugas) per sesi kelas — status "Terunggah/Belum diisi" terlihat oleh Admin di Learning Material monitoring.
- FR-D.4 Lihat rekap Beban Kerja Dosen (BKD) pribadi & riwayat plotting mengajar.
- FR-D.5 Buka sesi kelas sync (generate link video conference) untuk kelas mode Sync (Live).

### FR-E. Admin BAAK (Biro Akademik)
**E.1 Dashboard** — ringkasan siklus akademik berjalan, target SNDIKTI, kalender akademik, status kelas final.

**E.2 Mata Kuliah & Kurikulum**
- Bank Mata Kuliah: CRUD MK (kode, nama, SKS, tipe wajib/pilihan, prasyarat, mode pembelajaran), import CSV.
- Struktur Kurikulum: versi kurikulum per prodi (aktif/legacy), total SKS/semester, capaian pembelajaran lulusan (CPL), aturan migrasi antar-versi kurikulum.

**E.3 Kelas Kuliah**
- CRUD kelas: MK, prodi, periode, dosen utama + tim pendamping, kapasitas & ambang waitlist (buka kelas paralel otomatis), jadwal sesi (auto-generate atau manual), bobot komponen nilai (override per kelas), dokumen pendukung.
- Monitoring: kuota/terdaftar/waitlist, kunci nilai akhir semester, rekap nilai per mahasiswa.

**E.4 Jadwal Kelas Online** — penjadwalan terpadu Sync (live conference) & Async (modul LMS) lintas prodi, resolver bentrok jadwal.

**E.5 Learning Material** — monitoring progres unggahan materi/video/tugas oleh dosen per MK, sinkron dari LMS.

**E.6 Nilai & KHS** — status input nilai per kelas sebelum kunci nilai akhir, ingatkan dosen yang belum input, finalisasi.

**E.7 Absensi** — rekap presensi mahasiswa & jurnal mengajar dosen (sync dari LMS), ekspor Berita Acara Perkuliahan (BAP).

**E.8 Data Mahasiswa** — manajemen mahasiswa aktif/cuti/lulus/DO/mutasi, filter IPK rendah & kehadiran rendah, aktivasi NIM untuk transfer/pindahan, kelola akun (reset password, suspend, cabut akses LMS), audit log akses.

**E.9 Data Dosen** — profil dosen, plotting mengajar, ekspor BKD.

**E.10 Pendaftaran (Inbox PMB)** — antrean onboarding calon mahasiswa baru dari modul PMB (lihat integrasi §7), generate NIM batch.

**E.11 Persuratan** — antrean permintaan surat, verifikasi & tanda tangan digital (BSrE), template surat resmi kop universitas.

**E.12 Pembayaran/SPP** — status financial clearance per mahasiswa, rekap tunggakan, pengingat.

**E.13 Sinkron PDDikti** — ekspor data mahasiswa/nilai/dosen/kelas ke Feeder Kemdikbud, log sinkronisasi per tabel.

**E.14 Laporan** — kompilasi laporan internal/eksternal untuk pimpinan & akreditasi (custom periode & tabel, ekspor Excel/PDF).

**E.15 Pengaturan SIAKAD** (konfigurasi lintas modul)
- Format/komponen NIM (drag-order, counter per prodi per tahun).
- Tahun ajaran & periode akademik (tahapan siklus: KRS, UTS, UAS, masa sanggah nilai, dsb), termasuk aturan turunan otomatis (jumlah sesi, minggu efektif).
- Kurikulum aktif & migrasi.
- Ambang batas SKS maksimal berdasarkan rentang IPS.
- Skala nilai universitas (huruf ↔ angka mutu ↔ rentang nilai).
- Komponen & bobot penilaian default + pengali per tipe MK (MKU, Wajib Prodi, Pilihan, Skripsi, MBKM, Mengulang).
- Aturan absensi (bobot hadir/izin/alpa, ambang minimum, integrasi LMS Moodle otomatis vs input manual).
- Syarat kelulusan (MK wajib lulus, predikat, masa studi maksimal).

### FR-F. Kaprodi (subset akses dari Admin, dibatasi ke prodinya)
- FR-F.1 Dashboard Prodi — ringkasan kinerja akademik prodi berjalan.
- FR-F.2 **Inbox Approval Terpusat** — satu antrean untuk semua jenis permintaan approval (KRS, cuti, dsb) dengan prioritas & catatan wajib saat menolak.
- FR-F.3 Kurikulum Prodi, Kelas Kuliah, Mata Kuliah — sama seperti Admin BAAK tapi dibatasi ke prodinya.
- FR-F.4 **Plotting Dosen + BKD** — plot dosen ke MK, publish plotting, kirim ke Dosen PA, ekspor BKD.
- FR-F.5 Monitoring Mahasiswa Prodi — filter IPK/kehadiran rendah.
- FR-F.6 **Skripsi/Tugas Akhir** — monitoring mahasiswa bimbingan: tahapan (proposal/penelitian/sidang), progres, status sidang.
- FR-F.7 **Akreditasi BAN-PT** — 9 kriteria, target nilai, unggah evidence, status per kriteria (kurang/baik/sangat baik).
- FR-F.8 Laporan Prodi.

## 6. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Data akademik & dokumen (KTM, transkrip, ijazah) terenkripsi; tanda tangan digital surat via BSrE; akses berbasis role granular (Admin BAAK lintas prodi vs Kaprodi terbatas ke prodinya) |
| Integrasi | Sinkron dua arah dengan LMS (Moodle) untuk absensi, materi, nilai kuis; sinkron ke PDDikti Feeder; integrasi payment gateway untuk UKT/SPP (pola sama seperti PMB) |
| Auditability | Semua perubahan nilai, status akademik, dan akses akun tercatat aktor & waktu; nilai terkunci tidak bisa diubah tanpa jejak |
| Konsistensi Data | Perhitungan IPK/IPS/status kelulusan bersifat derived — dihitung otomatis dari `grades`, bukan input manual berulang |
| Ketersediaan | Modul KRS & pengisian nilai harus stabil saat periode puncak (awal semester, akhir semester) |
| Konfigurabilitas | Aturan akademik (SKS maksimal, bobot nilai, syarat kelulusan) harus data-driven lewat Pengaturan, bukan hardcoded |

## 7. Integrasi dengan Sistem Lain

**Dengan SSO Platform:**
- "SIAKAD Admin" didaftarkan sebagai `application` di SSO — role dinamis: `admin_baak`, `kaprodi`, `dosen` (saat portalnya sudah ada).
- Mahasiswa memiliki "Username SSO" (terlihat di form Data Mahasiswa) — login mahasiswa & akses LMS memakai SSO yang sama.

**Dengan SI-PMB UNSIA:**
- Panel **Pendaftaran (Inbox PMB)** di Admin BAAK adalah titik masuk data: begitu status pendaftar di PMB berubah menjadi "Diterima" dan menyelesaikan Daftar Ulang, SIAKAD men-generate NIM dan membuat record `students` baru — inilah proses **onboarding** yang jadi Portal Onboarding Mahasiswa Baru (FR-A).
- Data pendaftar PMB (`applicants`, dokumen, biodata) menjadi basis awal record `students` — sebaiknya di-*carry over*, bukan diinput ulang.

**Dengan LMS (Moodle, dsb):**
- Absensi & progres materi ditarik otomatis dari LMS (konfigurasi di Pengaturan → Integrasi LMS).

## 8. Alur Utama (User Journey)

### 8.1 Onboarding Mahasiswa Baru (dari PMB ke SIAKAD)
1. Status pendaftar PMB = "Diterima" → muncul di Inbox Pendaftaran Admin BAAK.
2. Mahasiswa login Portal Onboarding → lihat tagihan UKT Daftar Ulang → bayar.
3. Sistem generate NIM otomatis setelah pembayaran terkonfirmasi.
4. Mahasiswa mengisi KRS perdana (paket wajib semester 1) → ajukan ke Dosen PA.
5. Dosen PA approve → sistem generate KSM.
6. Mahasiswa cetak KTM digital → onboarding selesai → akses SSO ke LMS & Portal Mahasiswa Reguler terbuka.

### 8.2 Siklus KRS Semester Reguler (4 aktor)
1. **Admin BAAK**: setup periode akademik & kurikulum pusat.
2. **Kaprodi**: tentukan penawaran MK, plot dosen pengampu (sistem cek bentrok), publikasi jadwal.
3. **Mahasiswa**: isi KRS online → sistem validasi prasyarat & batas SKS.
4. **Dosen PA**: review pengajuan → approve/reject (dengan catatan bila reject).
5. **Sistem**: jika approved → generate KSM, update kuota kelas; jika waitlist penuh → notifikasi Kaprodi untuk buka kelas paralel.
6. **Kaprodi/Admin BAAK**: evaluasi efisiensi kelas di akhir periode.

## 9. Kebutuhan Data (Ringkas)

Lihat `ERD-SIAKAD-UNSIA.mermaid` untuk skema lengkap. Ringkasan domain:

- **Akademik/Master**: `academic_periods`, `curricula`, `curriculum_courses`, `courses`, `course_prerequisites`
- **Kelas & Pengajaran**: `classes`, `class_co_teachers`, `class_schedules`, `grade_components`, `learning_materials`
- **Sivitas**: `students`, `lecturers`, `study_programs`
- **KRS & Penilaian**: `krs`, `krs_items`, `krs_approvals`, `grades`, `attendances`
- **Onboarding & Keuangan**: `reregistration_invoices`, `spp_invoices`, `spp_payments`
- **Layanan Mahasiswa**: `letter_requests`, `achievements`, `theses` (skripsi/TA)
- **Mutu**: `accreditation_criteria`
- **Governance/Integrasi**: `audit_logs`, `pddikti_sync_logs`

## 10. Rencana Rilis (High-Level Roadmap)

| Fase | Cakupan |
|---|---|
| Fase 1 (MVP) | Onboarding mahasiswa baru, KRS reguler end-to-end (termasuk approval Dosen PA — **butuh Portal Dosen minimal**), Data Mahasiswa/Dosen, Kelas & Jadwal dasar, Nilai & KHS dasar |
| Fase 2 | Learning Material monitoring penuh, Absensi terintegrasi LMS, Persuratan digital + BSrE, SPP/keuangan penuh |
| Fase 3 | Sinkron PDDikti, Laporan lanjutan, Akreditasi BAN-PT, Skripsi/TA monitoring, Prestasi/SKPI |

## 11. Open Questions

- **Portal Dosen belum ada mockup** — perlu dirancang sebelum Fase 1 bisa selesai end-to-end, karena approval KRS (FR-C.3) dan input nilai (FR-D.2) adalah blocker inti siklus akademik.
- Apakah proses Daftar Ulang & UKT ini benar-benar bagian dari SIAKAD, atau tetap di bawah SI-PMB (perlu batas modul yang jelas — saat ini mockup `SIAKAD_ONBOARDING_...` menaruhnya di sisi SIAKAD)?
- Payment gateway untuk UKT — apakah sama dengan yang dipakai PMB, atau terpisah?
- Kebijakan detail retake mata kuliah/her-registrasi belum digali dari mockup.
- Bagaimana mekanisme reject KRS oleh Dosen PA memengaruhi kuota kelas yang sudah ter-hold sementara?
