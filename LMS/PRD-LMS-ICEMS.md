# Product Requirements Document (PRD)
## LMS ICEMS — Learning Management System UNSIA

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Tech Stack | Next.js (App Router, fullstack), Drizzle ORM, PostgreSQL (**database privat LMS**, arsitektur microservices — lihat Catatan-Arsitektur-Microservices.md) |
| Terkait | BRD-LMS-ICEMS.md, SIAKAD UNSIA, SSO Platform |

## 1. Ringkasan Produk

LMS ICEMS terdiri dari 2 portal utama (**Dosen** & **Mahasiswa**) yang berbagi struktur data kelas yang sama, dibedakan oleh hak akses. Unit kerja terkecil adalah **Sesi Pembelajaran** (1 sesi = 1 pertemuan), yang menampung Materi, Tugas, Kuis, Video Interaktif, dan Live Conference.

## 2. User Roles

| Peran | Akses |
|---|---|
| **Dosen** | Kelola kelas akademik (sesuai plotting) & kelas personal, kelola sesi & bahan ajar, nilai mahasiswa, buat kelompok |
| **Mahasiswa** | Akses kelas dari KRS, kerjakan tugas/kuis, ikut live conference, diskusi |
| **Prodi (Verifikator)** | Verifikasi tahap 1 materi ajar sebelum terbit |
| **BPM (Verifikator)** | Verifikasi tahap 2 (final) materi ajar |
| **Observer/Asisten** | Ditambahkan manual oleh dosen ke kelas tertentu, akses terbatas (lihat FR-4.6) |

## 3. Functional Requirements

### FR-1. Sinkronisasi Data Akademik (Auto-Sync dari SIAKAD)
- FR-1.1 Tarik data **Periode Akademik Aktif** dari SIAKAD.
- FR-1.2 Tarik **Dosen Pengampu** sesuai hasil plotting Kaprodi.
- FR-1.3 Tarik **Mata Kuliah** yang dibuka pada periode berjalan.
- FR-1.4 Tarik **Jadwal Kuliah** (hari/jam, SKS, mode daring/hybrid).
- FR-1.5 Tarik **Peserta MK** berdasarkan KRS yang sudah disetujui.
- FR-1.6 Kelas akademik otomatis muncul di dashboard Dosen & Mahasiswa begitu data tersinkron — tanpa aksi manual.
- FR-1.7 Status sinkronisasi terakhir ditampilkan di Info Kelas ("Sinkronisasi terakhir: 2 menit lalu").
- FR-1.8 Perubahan jadwal/SKS **hanya bisa diedit dari SIAKAD**; LMS menampilkan read-only dengan catatan arahan ke Kaprodi.

### FR-2. Manajemen Sesi Pembelajaran (Dosen)
- FR-2.1 Live Conference: pilih penyedia (Jitsi Internal/Zoom/Google Meet/Custom Link), jadwal tanggal/waktu/durasi, tautan otomatis dibuat & dibagikan ke seluruh peserta via notifikasi LMS + email + WhatsApp.
- FR-2.2 Materi: unggah dokumen (PDF/DOCX/PPT, maks 50MB) atau video, dengan opsi "Rilis Sekarang" atau "Jadwalkan".
- FR-2.3 Tugas: judul, instruksi, lampiran opsional, deadline, bobot nilai.
- FR-2.4 **Presensi otomatis** — mahasiswa yang join live conference tercatat hadir tanpa input manual.
- FR-2.5 Kuis: jumlah soal, durasi, bobot, jadwal buka-tutup.
- FR-2.6 Video Interaktif: unggah video (upload MP4 atau tautan YouTube) + **penanda pertanyaan** di titik waktu tertentu (mis. menit 03:08), tipe soal pilihan ganda atau esai.
- FR-2.7 Survei: pertanyaan + opsi jawaban, opsi tampilkan hasil ke mahasiswa setelah submit.
- FR-2.8 Pengumuman/Informasi: judul + isi, opsi kirim notifikasi ke seluruh peserta kelas.
- FR-2.9 **Publikasi Cepat** — tombol pintas dari linimasa diskusi kelas untuk langsung membuat salah satu dari FR-2.1–2.8 tanpa berpindah halaman.

### FR-3. Verifikasi Materi Berjenjang
- FR-3.1 Materi yang diunggah dosen berstatus awal "Menunggu Verifikasi Prodi".
- FR-3.2 Setelah Prodi setujui → status "Menunggu Verifikasi BPM".
- FR-3.3 Setelah BPM setujui → status "Terbit", baru tampil ke mahasiswa, dengan label "Diverifikasi oleh Prodi & BPM" beserta tanggal masing-masing.
- FR-3.4 Materi yang ditolak di tahap manapun kembali ke dosen dengan catatan revisi (pola sama seperti verifikasi dokumen PMB).

### FR-4. Manajemen Kelas (Dosen)
- FR-4.1 Info Kelas: nama MK, kode, SKS, periode, jadwal, metode, total sesi, total mahasiswa (sebagian besar read-only hasil sync, lihat FR-1.8).
- FR-4.2 RPS (Rencana Pembelajaran Semester): deskripsi MK, pustaka acuan, CPMK — dikelola dosen.
- FR-4.3 Duplikasi Bahan Ajar dari Periode Lalu — salin materi/tugas/resource dari kelas yang pernah diampu dosen tsb.
- FR-4.4 Kelompok Diskusi/Tugas — bentuk kelompok dari peserta kelas, mode **Otomatis** (acak / berdasarkan IPK / berdasarkan angkatan) atau **Manual** (pilih anggota satu per satu).
- FR-4.5 Daftar Peserta — lihat seluruh mahasiswa terdaftar (dari sync KRS).
- FR-4.6 Undang Peserta Tambahan — tambah NIM/email dengan peran **Observer** (audit, akses lihat saja) atau **Asisten** (bantu kelola kelas) — di luar daftar resmi KRS.
- FR-4.7 **Kelas Personal** — dosen buat kelas non-akademik sendiri (nama, deskripsi, tipe Self-paced/Jadwal Tetap, kontrol akses Undang Saja/Kode Akses/Publik) — tidak tersinkron SIAKAD.

### FR-5. Diskusi / Forum (Timeline Kelas)
- FR-5.1 Linimasa per kelas, setiap sesi/materi/tugas/dsb muncul sebagai post dengan like & komentar.
- FR-5.2 Mention pengguna lain (`@nama`) dalam komentar.
- FR-5.3 Mahasiswa bisa membuka thread diskusi umum ("Share Something with Your Class").

### FR-6. Pengerjaan Mahasiswa
- FR-6.1 Lihat/unduh/putar materi sesuai tipe berkas.
- FR-6.2 Kerjakan tugas: lembar jawaban dengan **auto-save draft**, lampiran pendukung opsional, submit dengan konfirmasi, bisa "Batalkan & Edit Ulang" sebelum dinilai.
- FR-6.3 Ikuti kuis dalam periode yang ditentukan.
- FR-6.4 Tonton video interaktif — jawab pertanyaan yang muncul di titik waktu tertentu.
- FR-6.5 Join live conference (tombol "Join Room") atau putar ulang rekaman jika sudah lewat.
- FR-6.6 Lihat status presensi aktivitas per sesi (mis. "4/6 Selesai").
- FR-6.7 Lihat hasil penilaian & feedback dosen setelah dinilai.

### FR-7. Penilaian (Dosen)
- FR-7.1 Daftar submission per tugas dengan status: Sudah Mengumpulkan / Sudah Dinilai / Belum Mengumpulkan.
- FR-7.2 **Anotasi langsung pada berkas jawaban** (klik & drag pada PDF untuk menambah catatan per bagian).
- FR-7.3 Input nilai (0–100) + feedback umum (rich text).
- FR-7.4 Simpan Sementara (draft penilaian) vs Simpan Penilaian (final, terlihat mahasiswa).
- FR-7.5 Rekap Nilai Mahasiswa per kelas: kolom Kehadiran, Tugas, UTS, UAS, Akhir, Huruf — dengan Mode Edit & ekspor.

### FR-8. AI Assistant
- FR-8.1 Widget tanya-jawab per mata kuliah, membantu mahasiswa/dosen mencari info terkait konten kelas tsb.

### FR-9. Notifikasi
- FR-9.1 Multi-kanal: dalam-LMS, email, WhatsApp — untuk materi baru, tugas baru, jadwal live conference, pengumuman.

## 4. Non-Functional Requirements

| Kategori | Kebutuhan |
|---|---|
| Integrasi | Sinkron satu arah (baca saja) dari SIAKAD untuk data akademik; integrasi API pihak ketiga (Zoom/Google Meet) atau Jitsi self-hosted; integrasi WA Business API/Email untuk notifikasi |
| Keamanan | Login via SSO (bukan akun terpisah); akses kelas dibatasi ke peserta terdaftar (+ observer/asisten yang diundang eksplisit) |
| Performa | Live conference & presensi otomatis harus real-time (< beberapa detik delay pencatatan hadir) |
| Auditability | Status verifikasi materi (Prodi/BPM) tercatat lengkap dgn tanggal & siapa yang memverifikasi |
| Ketersediaan | Sesi live & unggah tugas menjelang deadline adalah momen kritis — perlu tahan lonjakan akses |
| Konsistensi Data | Nilai akhir/huruf dihitung otomatis dari komponen, konsisten dengan aturan skala nilai yang sama dengan SIAKAD |

## 5. Integrasi dengan Sistem Lain (Microservices)

Mengikuti pola di `Catatan-Arsitektur-Microservices.md`:

- **Dengan SSO**: LMS didaftarkan sbg `application` — dosen/mahasiswa login pakai token SSO yang sama dengan SIAKAD.
- **Dengan SIAKAD**: LMS adalah **konsumen** data (bukan pemilik). Pola sinkron:
  - **Pull terjadwal** (job berkala, mis. tiap beberapa menit/jam): tarik periode aktif, MK, dosen pengampu, jadwal.
  - **Event dari SIAKAD** (lebih real-time untuk perubahan penting): `krs.approved` → tambah peserta ke kelas LMS; `class.dosen_changed` → update pengampu di LMS.
  - LMS **tidak menulis balik** ke database SIAKAD. Kalau nilai akhir LMS perlu masuk transkrip resmi, LMS **publish event** `grade.finalized` yang dikonsumsi SIAKAD (mirip pola PMB→SIAKAD) — bukan LMS query/update tabel `grades` SIAKAD langsung.
- **Dengan Provider Vicon**: panggil API Zoom/Google Meet untuk generate meeting link; atau host sendiri via Jitsi (self-hosted, lebih murah & terkontrol).

## 6. Alur Utama (ringkas — detail di Flow Bisnis)

1. Sync otomatis: SIAKAD → LMS (kelas, peserta, jadwal).
2. Dosen isi sesi: materi/tugas/kuis/video interaktif/live conference.
3. Materi melalui verifikasi Prodi → BPM → terbit.
4. Mahasiswa akses & kerjakan; presensi live otomatis tercatat saat join.
5. Dosen menilai (anotasi + feedback); nilai akhir & huruf terhitung otomatis.
6. LMS publish nilai final ke SIAKAD.

## 7. Kebutuhan Data (Ringkas)

Lihat `ERD-LMS-ICEMS.mermaid` untuk skema lengkap. Ringkasan domain:
- **Kelas**: `lms_classes` (tipe akademik/personal), `class_enrollments` (peran: mahasiswa/observer/asisten)
- **Sesi & Konten**: `sessions`, `materials`, `material_verifications`, `assignments`, `assignment_submissions`, `quizzes`, `quiz_questions`, `quiz_attempts`, `interactive_videos`, `video_markers`, `video_marker_answers`
- **Live Conference**: `video_conferences`, `vc_attendances` (presensi otomatis)
- **Kolaborasi**: `discussion_posts`, `discussion_comments`, `groups`, `group_members`
- **Penilaian**: `grades`, `submission_annotations`
- **Governance**: `sync_logs` (dari SIAKAD), `notification_logs`

## 8. Roadmap

| Fase | Cakupan |
|---|---|
| Fase 1 (MVP — target 2 minggu sesuai BRD) | Sync SIAKAD, kelas akademik otomatis, materi/tugas/kuis/video/live conference dasar, akses mahasiswa penuh |
| Fase 2 | Verifikasi berjenjang Prodi/BPM, Kelas Personal, Kelompok, anotasi PDF, AI Assistant |
| Fase 3 | Notifikasi WA penuh, analytics pembelajaran, integrasi provider vicon tambahan |

## 9. Open Questions

- Apakah nilai akhir yang dihitung di LMS **menggantikan** atau **melengkapi** perhitungan IPK/IPS di SIAKAD (lihat Logic-Aplikasi-SIAKAD §7)? Perlu kejelasan siapa *source of truth* nilai resmi.
- SLA verifikasi Prodi & BPM belum didefinisikan — berapa lama maksimal sebelum materi harus terbit?
- Kebijakan moderasi Kelas Personal (konten tidak pantas) belum ada di mockup.
- Kapan rekaman live conference dihapus/diarsipkan (kebijakan retensi storage)?
