# Product Requirements Document (PRD)
## Bank Konten Akademik UNSIA — Bank Materi & Bank Soal

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL (database privat, microservices) |
| Terkait | BRD-Bank-Konten-Akademik.md, SI-PMB, SIAKAD, LMS ICEMS, SSO Platform |

## 1. Ringkasan Produk

Layanan ini punya 2 modul inti (**Bank Materi**, **Bank Soal**) yang berbagi infrastruktur yang sama: kategorisasi per mata kuliah, tagging, verifikasi berjenjang (Prodi → BPM), versioning, dan pelacakan pemakaian — lalu diekspos sebagai API/event untuk ditarik oleh PMB, SIAKAD, dan LMS.

## 2. User Roles

| Peran | Akses |
|---|---|
| Dosen | Kontribusi materi/soal, cari & pakai ulang konten terverifikasi |
| Prodi (Verifikator) | Verifikasi tahap 1 |
| BPM (Verifikator) | Verifikasi tahap 2 (final) |
| Admin Bank Konten | Kelola kategori/taksonomi, monitoring adopsi lintas sistem |
| Sistem Konsumen (PMB/SIAKAD/LMS) | Konsumsi via API — bukan user manusia, tapi punya "hak akses" berupa API key/OAuth2 client credentials |

## 3. Functional Requirements

### FR-1. Bank Materi
- FR-1.1 Unggah materi (dokumen/video/presentasi/dataset) dengan judul, deskripsi, MK terkait (`course_ref`, kode MK — bukan FK, lihat §5), topik/tag.
- FR-1.2 Kategorisasi hierarkis: Mata Kuliah → Topik/Pokok Bahasan → (opsional) Sub-topik.
- FR-1.3 Versioning — revisi materi yang sudah terbit membentuk versi baru (BR-03), riwayat versi terlihat & bisa dibandingkan.
- FR-1.4 Pencarian & filter: per MK, topik, tag, tipe berkas, kontributor.
- FR-1.5 Pemakaian ulang — dosen lain (bukan hanya kontributor asli) bisa "Tambahkan ke Kelas Saya" (via LMS) tanpa unggah ulang; atribusi kontributor asli tetap tampil (BR-06).
- FR-1.6 Verifikasi berjenjang Prodi → BPM sebelum status "Terbit" (BR-01), pola identik dengan verifikasi materi LMS.
- FR-1.7 Statistik pemakaian: berapa kelas/dosen yang memakai materi ini, kapan terakhir dipakai.

### FR-2. Bank Soal
- FR-2.1 CRUD butir soal: teks soal, tipe (pilihan ganda/esai/pilihan ganda kompleks), opsi jawaban, kunci jawaban, MK & topik terkait.
- FR-2.2 Metadata kualitas: tingkat kesukaran (mudah/sedang/sulit — bisa manual awal, diperbarui otomatis dari item analysis), taksonomi Bloom (C1–C6).
- FR-2.3 Tagging bebas (mis. "kurikulum 2024", "kasus nyata", dsb) untuk pencarian lebih granular.
- FR-2.4 Verifikasi berjenjang Prodi → BPM (BR-01).
- FR-2.5 Soal yang sudah dipakai di ujian resmi tidak bisa dihapus, hanya diarsipkan (BR-02); revisi membentuk versi baru (BR-03).
- FR-2.6 **Generate Otomatis** — buat kumpulan soal sesuai kriteria: MK/topik, jumlah soal, distribusi tingkat kesukaran (mis. 30% mudah/50% sedang/20% sulit), exclude soal dengan `usage_count` tinggi baru-baru ini (BR-04).
- FR-2.7 **Analisis Butir Soal** — dihitung dari data hasil pengerjaan yang ditarik balik dari sistem konsumen (lihat §5): tingkat kesukaran aktual (% benar), daya beda (discrimination index, membandingkan performa kelompok atas vs bawah), minimal N responden (BR-05).
- FR-2.8 Flag otomatis untuk soal dengan indikator kualitas buruk (terlalu mudah/sulit, daya beda negatif) — tampil sbg rekomendasi revisi ke kontributor.

### FR-3. Verifikasi Berjenjang (Shared, Materi & Soal)
- FR-3.1 Status: `draft` → `menunggu_prodi` → `menunggu_bpm` → `terbit` (atau `revisi` di tahap manapun, kembali ke kontributor dengan catatan) — identik pola dengan Logic-Aplikasi-LMS.md §2.
- FR-3.2 Notifikasi otomatis ke verifikator terkait & ke kontributor saat status berubah.

### FR-4. API & Integrasi Keluar
- FR-4.1 **API Tarik Materi** — sistem konsumen (LMS) bisa query materi terverifikasi by MK/topik untuk ditampilkan sbg opsi "pakai dari Bank Materi" saat dosen menyiapkan sesi.
- FR-4.2 **API Tarik Soal** — sistem konsumen (PMB/SIAKAD/LMS) bisa request sejumlah soal sesuai kriteria (generate otomatis FR-2.6), hasilnya di-**snapshot/cache** ke sistem pemanggil (bukan live-query saat ujian berlangsung — mitigasi risiko di BRD §8).
- FR-4.3 **API/Event Terima Hasil Pengerjaan** — sistem konsumen mengirim balik data agregat hasil pengerjaan (soal mana dijawab benar/salah oleh berapa peserta) untuk keperluan item analysis (FR-2.7) — bukan data personal peserta, cukup agregat per soal.
- FR-4.4 Autentikasi antar-service via OAuth2 client credentials (SSO), sama seperti pola integrasi modul lain.

### FR-5. Admin & Tata Kelola
- FR-5.1 Kelola master Mata Kuliah/Topik (idealnya **konsumsi** dari SIAKAD `courses`, bukan duplikasi manual — lihat catatan integrasi §5).
- FR-5.2 Dashboard adopsi: berapa banyak materi/soal ditarik oleh masing-masing sistem konsumen (PMB/SIAKAD/LMS).
- FR-5.3 Kelola daftar verifikator (Prodi/BPM) per rumpun MK.

## 4. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Keamanan | Soal yang belum "Terbit" atau sedang dipakai ujian aktif **tidak boleh** bisa diakses/di-fetch oleh peran non-verifikator — risiko kebocoran soal |
| Performa | API Tarik Soal harus cepat (<1 detik untuk generate set soal) karena dipanggil saat setup ujian, bukan real-time saat ujian berjalan (mitigasi lewat caching di sistem konsumen) |
| Auditability | Setiap penarikan soal/materi oleh sistem lain tercatat (`usage_logs`) — termasuk kapan, oleh sistem apa, untuk keperluan apa |
| Konsistensi Data | Statistik item analysis harus dihitung ulang otomatis tiap kali data hasil pengerjaan baru masuk, bukan dihitung sekali lalu statis |
| Ketersediaan | Downtime API Tarik Soal **tidak boleh memblokir ujian yang sedang berlangsung** — karena arsitektur cache di sisi konsumen (FR-4.2), ujian yang sudah dimulai tetap jalan walau Bank Konten down |

## 5. Integrasi dengan Sistem Lain (Microservices)

Mengikuti pola `Catatan-Arsitektur-Microservices.md` — **database privat**, tidak ada FK lintas sistem:

- **Dengan SSO**: didaftarkan sbg `application`; autentikasi manusia (dosen/verifikator) & service-to-service (PMB/SIAKAD/LMS) sama-sama lewat token SSO.
- **Dengan SIAKAD**: **pull** daftar MK & kurikulum (`courses`) untuk kategorisasi konten (FR-5.1) — `course_ref` disimpan sbg **kode MK** (string), bukan UUID SIAKAD, mengikuti pola mapping yang sudah dipakai di titik integrasi PMB↔SIAKAD (lihat Integrasi-Data-PMB-SIAKAD-LMS, titik ①).
- **Dengan LMS**: 
  - LMS **menarik** materi/soal terverifikasi (FR-4.1, FR-4.2) saat dosen menyiapkan sesi/kuis.
  - LMS **mengirim balik** data agregat hasil kuis (FR-4.3) untuk item analysis.
- **Dengan SIAKAD (UTS/UAS)** & **PMB (ujian seleksi)**: pola sama seperti LMS — tarik soal, kirim balik hasil agregat — **opsional**, sistem-sistem ini tetap bisa jalan mandiri dengan tabel soal sendiri jika belum ada waktu integrasi (lihat roadmap BRD §9).

**Batas tanggung jawab tegas**: Bank Konten **tidak pernah** tahu siapa peserta ujian atau kapan ujian berlangsung — ia hanya penyedia konten & penerima agregat statistik. Pelaksanaan ujian (timer, auto-submit, penilaian individual) sepenuhnya tetap di sistem masing-masing (PMB/SIAKAD/LMS), sesuai batas yang sudah ditegaskan juga antara LMS dan SIAKAD soal nilai (lihat Logic-Aplikasi-LMS.md §9).

## 6. Alur Utama (ringkas — detail di Flow Bisnis)

1. Dosen kontribusi materi/soal ke Bank Konten → verifikasi Prodi → BPM → terbit.
2. Sistem konsumen (LMS/SIAKAD/PMB) menarik materi/soal terverifikasi saat menyiapkan sesi/ujian → cache lokal.
3. Ujian/kuis berlangsung di sistem konsumen masing-masing (Bank Konten tidak terlibat).
4. Sistem konsumen kirim balik data agregat hasil pengerjaan → Bank Konten hitung ulang item analysis.
5. Soal dengan indikator kualitas buruk ditandai untuk direvisi dosen.

## 7. Kebutuhan Data (Ringkas)

Lihat `ERD-Bank-Konten-Akademik.mermaid` untuk skema lengkap. Ringkasan domain:
- **Bank Materi**: `material_bank_items`, `material_bank_versions`, `material_usage_logs`
- **Bank Soal**: `question_bank_items`, `question_bank_options`, `question_bank_versions`, `question_usage_logs`, `question_item_analysis`, `quiz_generation_rules`
- **Governance**: `verification_records` (shared materi & soal), `audit_logs`

## 8. Roadmap

Sama seperti BRD §9 — Fase 1 (Bank Materi & Soal dasar + integrasi LMS) → Fase 2 (integrasi opsional SIAKAD & PMB) → Fase 3 (generate otomatis penuh + item analysis).

## 9. Open Questions

- Siapa yang berwenang jadi "Admin Bank Konten" — apakah BPM yang sudah ada, atau perlu peran baru?
- Apakah PMB & SIAKAD **wajib** bermigrasi ke Bank Konten di suatu titik, atau boleh selamanya pakai tabel soal sendiri secara paralel?
- Bagaimana menangani soal multi-bahasa (jika UNSIA ke depan buka kelas internasional)?
- Perlu kebijakan lisensi/hak cipta materi yang diunggah dosen (terutama jika dosen keluar dari UNSIA, materi tetap milik institusi atau tidak)?
