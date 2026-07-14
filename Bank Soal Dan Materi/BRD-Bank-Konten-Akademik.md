# Business Requirements Document (BRD)
## Bank Konten Akademik UNSIA — Bank Materi & Bank Soal

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Terkait | SI-PMB (exam_questions), SIAKAD (UTS/UAS), LMS ICEMS (materials, quiz_questions) |
| Sifat dokumen | **Rekomendasi arsitektur** — modul ini belum ada di mockup manapun, diusulkan untuk mengisi gap yang teridentifikasi saat menyusun PMB/SIAKAD/LMS |

## 1. Ringkasan Bisnis

Bank Konten Akademik adalah **repositori terpusat** untuk dua jenis aset pembelajaran yang sifatnya reusable — **Bank Materi** (dokumen/video/presentasi ajar) dan **Bank Soal** (butir soal ujian/kuis) — yang dikonsumsi oleh SI-PMB (ujian seleksi), SIAKAD (UTS/UAS), dan LMS (kuis & materi sesi), alih-alih masing-masing sistem menyimpan kontennya sendiri secara terisolasi.

## 2. Latar Belakang & Problem Statement

Saat menyusun PMB, SIAKAD, dan LMS secara terpisah, ditemukan **duplikasi struktural**:
- PMB punya `exam_questions`, SIAKAD punya soal UTS/UAS (belum terstruktur formal), LMS punya `quiz_questions` — tiga tempat berbeda untuk konsep yang sama: **butir soal**.
- LMS punya fitur "Duplikasi Bahan Ajar dari Periode Lalu" yang **terbatas ke kelas milik dosen yang sama** — tidak ada mekanisme berbagi materi lintas dosen/prodi walau topiknya identik (mis. MK dasar yang diajar banyak dosen paralel).
- Tidak ada tempat mengelola **kualitas soal** (analisis butir soal — tingkat kesukaran & daya beda) dari hasil ujian yang sesungguhnya, sehingga soal yang "terlalu mudah/susah" atau bias tidak pernah dievaluasi sistematis.

## 3. Tujuan Bisnis

- Dosen & panitia ujian tidak perlu membuat soal dari nol setiap periode — bisa **cari, tinjau, dan gunakan ulang** soal yang sudah terverifikasi kualitasnya.
- Materi ajar berkualitas (yang sudah lolos verifikasi Prodi/BPM di LMS) bisa **dipakai ulang** oleh dosen lain yang mengampu MK sama, bukan hanya oleh dosen aslinya.
- Kualitas soal terpantau lewat **analisis butir soal otomatis** (tingkat kesukaran, daya beda) berdasarkan data hasil pengerjaan sesungguhnya dari PMB/SIAKAD/LMS.
- Satu sumber kebenaran untuk konten pembelajaran — mengurangi risiko soal/materi usang beredar tanpa kendali versi.

## 4. Ruang Lingkup

**Termasuk:**
- Bank Materi: unggah, kategorisasi (per MK/topik), versioning, tagging, pencarian, verifikasi berjenjang (pola sama seperti LMS: Prodi → BPM), pemakaian ulang lintas kelas/dosen.
- Bank Soal: bank butir soal per MK/topik/tingkat kesukaran/taksonomi Bloom, verifikasi berjenjang, generate kuis/ujian otomatis dari kriteria (jumlah soal, distribusi kesukaran), analisis butir soal (item analysis) dari hasil pengerjaan nyata.
- API/event untuk dikonsumsi PMB (ujian seleksi), SIAKAD (UTS/UAS), LMS (kuis & materi sesi).
- Pelacakan pemakaian (usage log) — soal/materi mana dipakai di ujian/kelas mana, kapan.

**Tidak termasuk:**
- Pelaksanaan ujian/kuis itu sendiri (timer, submit, penilaian) — itu tetap domain PMB/SIAKAD/LMS masing-masing (lihat §7 PRD untuk batas integrasi tegas).
- Bank Konten **tidak menggantikan** tabel `exam_questions`/`quiz_questions` yang sudah ada secara paksa — migrasi bersifat **opsional & bertahap** (lihat §9 Roadmap).

## 5. Stakeholder / Aktor

| Aktor | Kepentingan |
|---|---|
| Dosen | Kontributor materi & soal, pengguna ulang konten yang sudah ada |
| Prodi (Verifikator) | Verifikasi tahap 1 kualitas materi/soal |
| BPM (Verifikator) | Verifikasi tahap 2 (final), penjaminan mutu |
| Panitia PMB | Konsumen Bank Soal untuk ujian seleksi |
| Admin BAAK/Kaprodi (SIAKAD) | Konsumen Bank Soal untuk UTS/UAS terstandar |
| Sistem LMS | Konsumen Bank Materi & Bank Soal untuk kuis dan sesi kelas |

## 6. Aturan Bisnis (Business Rules)

| # | Aturan |
|---|---|
| BR-01 | Materi & soal **wajib melalui verifikasi berjenjang** (Prodi → BPM) sebelum berstatus "Terbit" dan bisa dipakai sistem lain — konsisten dengan pola BR-02 di LMS |
| BR-02 | Soal yang **sudah pernah dipakai** dalam ujian resmi (UTS/UAS/seleksi) tidak boleh dihapus — hanya bisa dinonaktifkan (`arsip`), demi jejak audit hasil ujian yang pernah pakai soal itu |
| BR-03 | Revisi materi/soal yang sudah "Terbit" **membentuk versi baru**, versi lama tetap tersimpan (tidak overwrite) — supaya ujian yang sudah berlangsung tidak berubah retroaktif |
| BR-04 | Generate kuis/ujian otomatis dari Bank Soal **tidak boleh mengambil soal dengan `usage_count` terlalu tinggi** dalam periode singkat (mencegah soal "bocor" karena terlalu sering dipakai berturut-turut) |
| BR-05 | Analisis butir soal (item analysis) hanya dihitung dari attempt yang **statusnya final/submitted**, bukan draft — dan minimal butuh N responden untuk hasil statistik dianggap valid |
| BR-06 | Kontributor asli (dosen pembuat) tetap tercatat pada tiap materi/soal walau dipakai ulang oleh dosen lain — atribusi tidak hilang |

## 7. Metrik Sukses

| Metrik | Target Indikatif |
|---|---|
| Adopsi lintas sistem | PMB, SIAKAD, dan LMS sama-sama menarik konten dari Bank Konten (bukan hanya salah satu) |
| Tingkat pemakaian ulang materi | Materi yang sama dipakai oleh >1 dosen/kelas, bukan cuma pembuat aslinya |
| Cakupan analisis butir soal | Soal aktif yang punya data item analysis (tingkat kesukaran & daya beda) meningkat dari waktu ke waktu |
| Waktu verifikasi | Materi/soal baru terverifikasi (Prodi+BPM) dalam SLA yang disepakati (mis. maks 2x24 jam) |

## 8. Risiko Bisnis

| Risiko | Mitigasi |
|---|---|
| Resistensi dosen memakai bank bersama (lebih nyaman pakai punya sendiri) | Sosialisasi + insentif non-teknis (mis. pengakuan kontribusi), UX pencarian yang cepat & relevan |
| Kualitas soal lama yang sudah telanjur dipakai ternyata buruk (baru ketahuan dari item analysis) | BR-03 (versioning) memastikan revisi tidak menghapus jejak, cukup buat versi baru & tandai versi lama "tidak direkomendasikan" |
| Migrasi dari `exam_questions`/`quiz_questions` existing mengganggu sistem yang sudah jalan | Migrasi opsional & bertahap (lihat roadmap), sistem lama tetap berfungsi mandiri selama masa transisi |
| Ketergantungan tunggal (single point of failure) — jika Bank Konten down, PMB/SIAKAD/LMS ikut terganggu saat butuh generate ujian baru | Setiap sistem konsumen tetap simpan **cache lokal** soal yang sudah ditarik untuk ujian yang akan berlangsung — tidak query live saat ujian sedang berjalan |

## 9. Roadmap Ringkas

| Fase | Fokus |
|---|---|
| Fase 1 (MVP) | Bank Materi & Bank Soal dasar: CRUD, kategorisasi, verifikasi berjenjang, API untuk ditarik sistem lain (LMS materi & kuis duluan, karena paling siap) |
| Fase 2 | Integrasi ke SIAKAD (UTS/UAS) dan PMB (ujian seleksi) — opsional, bertahap, sistem lama tetap jalan berdampingan |
| Fase 3 | Generate otomatis (kuis/ujian dari kriteria distribusi kesukaran), Analisis Butir Soal dari data hasil ujian nyata |
