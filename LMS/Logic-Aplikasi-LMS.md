# Logic Aplikasi — LMS ICEMS

| Metadata | Keterangan |
|---|---|
| Terkait | PRD-LMS-ICEMS.md, ERD-LMS-ICEMS.mermaid, Flow-Bisnis-LMS-ICEMS.mermaid |
| Tujuan | Algoritma/aturan bisnis konkret siap-implementasi |
| Versi | 1.0 — 12 Juli 2026 |

---

## 1. Sinkronisasi dari SIAKAD (Pull + Event)

```
FUNGSI job_sync_berkala():   # dijalankan tiap N menit
    periode_aktif = CALL SIAKAD_API GET /api/academic-periods?status=berjalan

    UNTUK SETIAP class DALAM CALL SIAKAD_API GET /api/classes?period_id=periode_aktif.id:
        UPSERT lms_classes (
            siakad_class_id = class.id,   # nilai referensi biasa, BUKAN FK (beda DB)
            course_code = class.course.code,
            course_name = class.course.name,
            sks = class.course.sks,
            dosen_user_id = class.dosen_utama_id,   # ini SUDAH user_id SSO, konsisten lintas service
            schedule_text = FORMAT(class.schedules),
            class_type = 'akademik',
            last_synced_at = now()
        )

    UNTUK SETIAP krs_item DALAM CALL SIAKAD_API GET /api/krs-items?status=disetujui&period_id=periode_aktif.id:
        lms_class = GET lms_classes WHERE siakad_class_id = krs_item.class_id
        JIKA lms_class TIDAK ADA: LEWATI (akan tersinkron di siklus berikutnya)
        UPSERT class_enrollments (
            class_id = lms_class.id, user_id = krs_item.krs.student.user_id,
            role = 'mahasiswa', krs_item_ref = krs_item.id
        )

    CATAT sync_logs (entity_synced, row_count, status)
```

**Event-driven (lebih real-time, opsional pelengkap pull)**:
```
FUNGSI consume_event_krs_approved(event):
    # idempotent — cek dulu sebelum insert (pola sama seperti PMB→SIAKAD)
    JIKA EXISTS class_enrollments WHERE krs_item_ref = event.krs_item_id:
        KELUAR
    lms_class = GET lms_classes WHERE siakad_class_id = event.class_id
    JIKA lms_class TIDAK ADA:
        SIMPAN event ke antrean tunda (retry setelah job sync kelas berikutnya)
        KELUAR
    INSERT class_enrollments (...)
    TRIGGER notifikasi "Kelas baru tersedia di LMS"
```

**Penanganan kegagalan sync**: jika SIAKAD API tidak bisa dihubungi, job sync **tidak boleh menghapus** kelas/peserta yang sudah ada (hanya upsert, tidak ada delete otomatis) — mencegah kelas "hilang" dari LMS akibat gangguan sementara. Penghapusan data usang (mis. mahasiswa keluar dari KRS) ditangani terpisah lewat event eksplisit, bukan diff otomatis dari hasil pull yang gagal sebagian.

---

## 2. Verifikasi Materi Berjenjang (Prodi → BPM)

```
FUNGSI submit_materi(session_id, data, dosen_id):
    INSERT materials (session_id, ..., verification_status = 'menunggu_prodi')
    TRIGGER notifikasi ke verifikator Prodi terkait

FUNGSI proses_verifikasi(material_id, tahap, keputusan, catatan, verifier_id):
    materi = GET materials WHERE id = material_id

    JIKA tahap == 'prodi':
        JIKA materi.verification_status != 'menunggu_prodi':
            TOLAK — bukan tahap yang sesuai
        JIKA keputusan == 'setuju':
            UPDATE materi.verification_status = 'menunggu_bpm'
            UPDATE materi.verified_by_prodi_user_id = verifier_id, verified_by_prodi_at = now()
            TRIGGER notifikasi ke verifikator BPM
        JIKA keputusan == 'revisi':
            UPDATE materi.verification_status = 'revisi', revision_note = catatan
            TRIGGER notifikasi ke dosen

    JIKA tahap == 'bpm':
        JIKA materi.verification_status != 'menunggu_bpm':
            TOLAK — belum lolos Prodi
        JIKA keputusan == 'setuju':
            UPDATE materi.verification_status = 'terbit'
            UPDATE materi.verified_by_bpm_user_id = verifier_id, verified_by_bpm_at = now()
            TRIGGER notifikasi ke seluruh peserta kelas: "Materi baru tersedia"
        JIKA keputusan == 'revisi':
            UPDATE materi.verification_status = 'revisi', revision_note = catatan
            TRIGGER notifikasi ke dosen
```

**Mahasiswa hanya bisa melihat** `materials` dengan `verification_status = 'terbit'` — filter ini wajib diterapkan di level query API, bukan hanya di UI (agar tidak bisa diakses lewat URL langsung).

**Catatan tipe konten lain**: Tugas/Kuis/Video Interaktif/Live Conference **tidak melalui alur verifikasi ini** di mockup (hanya Materi) — kalau ternyata perlu diperluas ke semua tipe konten, gunakan struktur `verification_status` yang sama secara generik.

---

## 3. Presensi Otomatis dari Live Conference

```
SAAT user join meeting (webhook dari provider vicon, atau event dari client Jitsi internal):
    INSERT vc_attendances (video_conference_id, user_id, joined_at=now())

SAAT user leave:
    UPDATE vc_attendances.left_at = now()

FUNGSI hitung_presensi_final(video_conference_id):
    durasi_sesi = video_conferences.duration_minutes
    UNTUK SETIAP vc_attendance:
        durasi_hadir = attendance.left_at - attendance.joined_at
        JIKA durasi_hadir >= (durasi_sesi * ambang_persen_hadir)  # mis. minimal 75% durasi
            UPDATE attendance.counted_as_present = true
        LAIN:
            UPDATE attendance.counted_as_present = false
            # tetap tercatat join, tapi tidak dihitung hadir penuh — bisa jadi flag "hadir sebagian"
```

**Edge case — join tapi koneksi putus tanpa event "leave"**: gunakan heartbeat (client kirim ping tiap 30 detik); jika heartbeat berhenti, server set `left_at` = waktu heartbeat terakhir setelah timeout (mis. 2 menit tanpa ping).

---

## 4. Auto-save & Submit Tugas

```
SAAT mahasiswa mengetik jawaban (client-side, throttled ±5 detik):
    UPSERT assignment_submissions (assignment_id, student_user_id, answer_text, status='draft')
    # belum dianggap "terkirim" sampai submit eksplisit

FUNGSI submit_tugas(assignment_id, student_id):
    submission = GET assignment_submissions
    JIKA now() > assignment.deadline:
        # kebijakan: tolak, atau terima dgn tanda "Terlambat" — tergantung aturan dosen/kampus
        TANDAI submission.late = true   # tetap diterima, tapi ditandai (rekomendasi default)
    UPDATE submission.status = 'terkirim', submitted_at = now()
    TRIGGER notifikasi ke dosen: "Submission baru"

FUNGSI batalkan_dan_edit_ulang(submission_id, student_id):
    JIKA submission.status == 'dinilai':
        TOLAK — tidak bisa edit setelah dinilai (harus lewat request khusus ke dosen)
    UPDATE submission.status = 'draft'
    # mahasiswa bisa edit ulang, submit lagi (submitted_at ter-update)
```

---

## 5. Kuis — Timer & Auto-submit

*(Pola identik dengan Logic-Aplikasi-PMB.md §6 untuk CBT — dipakai ulang karena kebutuhannya sama persis: timer server-side, auto-save jawaban, auto-submit saat waktu habis.)*

```
SAAT mahasiswa mulai kuis (dalam rentang open_at–close_at):
    INSERT quiz_attempts (status='sedang_mengerjakan', started_at=now())

SETIAP jawaban diisi: auto-save (upsert jawaban per soal)

POLLING/scheduler:
    JIKA now() >= started_at + quiz.duration_minutes*60 ATAU now() >= quiz.close_at:
        JIKA attempt.status == 'sedang_mengerjakan':
            AUTO-SUBMIT: UPDATE status='selesai', submitted_at=now()
            HITUNG skor (jika semua soal pilihan ganda, otomatis; jika ada esai, tandai "menunggu penilaian manual")
```

---

## 6. Video Interaktif — Penanda Pertanyaan

```
SAAT mahasiswa menonton video DAN playhead melewati timestamp_seconds sebuah marker:
    PAUSE video (client-side)
    TAMPILKAN pertanyaan dari video_markers
    SAAT dijawab:
        INSERT video_marker_answers (marker_id, student_user_id, answer_text, answered_at)
        JIKA question_type == 'pilihan_ganda':
            TAMPILKAN feedback benar/salah langsung
        RESUME video

FUNGSI cek_progress_video(student_id, interactive_video_id):
    total_markers = COUNT video_markers WHERE interactive_video_id = ...
    markers_terjawab = COUNT video_marker_answers WHERE student_user_id = ... DAN marker IN (markers video ini)
    progress_percent = markers_terjawab / total_markers * 100
    # dipakai utk indikator "X/Y Selesai" pada presensi aktivitas mahasiswa (FR-6.6)
```

---

## 7. Pembentukan Kelompok

```
FUNGSI bentuk_kelompok_otomatis(class_id, group_count, members_per_group, metode):
    peserta = GET class_enrollments WHERE class_id=class_id AND role='mahasiswa'

    JIKA metode == 'acak':
        SHUFFLE(peserta)
        BAGI RATA ke group_count kelompok (sisa peserta didistribusi ke kelompok² awal)

    JIKA metode == 'berdasarkan_ipk':
        # asumsi: LMS panggil SIAKAD API utk data IPK terkini (bukan disimpan lokal, hindari data basi)
        ipk_map = CALL SIAKAD_API GET /api/students/ipk?ids=[peserta.user_id...]
        URUTKAN peserta by ipk DESC
        BAGI dgn metode "snake draft" (1,2,3...N,N...3,2,1) supaya tiap kelompok
             punya sebaran IPK tinggi-rendah yang merata — bukan sekadar dipotong berurutan

    JIKA metode == 'berdasarkan_angkatan':
        KELOMPOKKAN peserta by angkatan dulu, lalu distribusi merata ke tiap kelompok
        (supaya tiap kelompok idealnya campuran angkatan, bukan 1 kelompok isi angkatan sama semua)

    UNTUK SETIAP kelompok terbentuk:
        INSERT groups (activity_name, formation_mode=metode)
        INSERT group_members UNTUK SETIAP anggotanya

FUNGSI bentuk_kelompok_manual(class_id, daftar_anggota_per_kelompok):
    UNTUK SETIAP kelompok DALAM input:
        INSERT groups, group_members sesuai pilihan dosen
    # validasi: 1 mahasiswa tidak boleh dobel di 2 kelompok dalam 1 activity_name yang sama
```

---

## 8. Duplikasi Bahan Ajar dari Periode Lalu

```
FUNGSI duplikasi_bahan_ajar(source_class_id, target_class_id, dosen_id):
    JIKA GET lms_classes(source_class_id).dosen_user_id != dosen_id:
        TOLAK — hanya boleh duplikasi dari kelas yang pernah diampu dosen ybs sendiri

    sessions_lama = GET sessions WHERE class_id = source_class_id ORDER BY session_number

    UNTUK SETIAP sesi_lama DALAM sessions_lama:
        sesi_baru = INSERT sessions (class_id=target_class_id, session_number=sesi_lama.session_number,
                                      topic=sesi_lama.topic, description=sesi_lama.description)
                    # tanggal/jam TIDAK disalin — ambil dari jadwal SIAKAD kelas baru (hasil sync §1)

        UNTUK SETIAP materi DALAM materials WHERE session_id = sesi_lama.id:
            INSERT materials (session_id=sesi_baru.id, ..., verification_status='menunggu_prodi')
            # WAJIB verifikasi ULANG walau kontennya sama persis — BR-02 berlaku tanpa pengecualian

        UNTUK SETIAP tugas DALAM assignments WHERE session_id = sesi_lama.id:
            INSERT assignments (session_id=sesi_baru.id, title, instructions, weight_percent,
                                 deadline = null)   # dosen WAJIB set ulang deadline, tidak boleh ikut tanggal lama

        (pola serupa untuk quizzes, interactive_videos — deadline/jadwal di-reset, konten disalin)
```

---

## 9. Perhitungan Nilai Akhir & Publish ke SIAKAD

```
FUNGSI hitung_nilai_akhir(class_id, student_id):
    kehadiran_pct = (COUNT vc_attendances WHERE counted_as_present=true)
                    / (COUNT total sesi live conference di kelas ini) * 100
    tugas_avg = RATA-RATA assignment_submissions.score UNTUK mahasiswa ini DI kelas ini
    uts_score = ambil dari assignment/quiz yang ditandai sbg tipe UTS
    uas_score = ambil dari assignment/quiz yang ditandai sbg tipe UAS

    bobot = GET bobot komponen (default sama dgn konfigurasi SIAKAD, lihat Logic-Aplikasi-SIAKAD §7)
    final_score = kehadiran_pct*bobot.kehadiran + tugas_avg*bobot.tugas
                  + uts_score*bobot.uts + uas_score*bobot.uas

    letter_grade = MAP final_score KE skala huruf (sama seperti SIAKAD)

    UPSERT grades (class_id, student_id, attendance_score=kehadiran_pct, assignment_score=tugas_avg,
                   uts_score, uas_score, final_score, letter_grade, published_to_siakad=false)

FUNGSI publikasikan_nilai(class_id, dosen_id):
    # dipicu manual oleh dosen (tombol "Kunci & Publikasikan"), BUKAN otomatis
    UNTUK SETIAP grade DALAM grades WHERE class_id = class_id:
        JIKA grade.final_score KOSONG:
            TOLAK publikasi keseluruhan — semua mahasiswa harus punya nilai lengkap dulu
    UNTUK SETIAP grade:
        PUBLISH event "grade.finalized" KE SIAKAD, BERISI:
            { siakad_class_id, student_user_id, final_score, letter_grade }
        UPDATE grade.published_to_siakad = true, published_at = now()
    # SIAKAD yang memutuskan bagaimana ini masuk ke grade_point/IPK resmi (lihat Logic-Aplikasi-SIAKAD §7),
    # LMS TIDAK menghitung grade_point/mutu — itu tetap wewenang SIAKAD sbg source of truth akademik resmi
```

---

## 10. Ringkasan Edge Cases Penting

| Kasus | Penanganan |
|---|---|
| Materi diedit dosen setelah terbit (sudah dilihat mahasiswa) | Perubahan signifikan harus mengembalikan status ke `menunggu_prodi` lagi (re-verifikasi), bukan langsung update konten yang sudah "resmi" |
| Mahasiswa keluar dari KRS di tengah semester (drop MK) | Event dari SIAKAD (`krs_item.cancelled`) → `class_enrollments` dihapus/nonaktifkan, TAPI riwayat submission/nilai yang sudah ada **tidak dihapus** (arsip) |
| Dua verifikator Prodi memproses materi yang sama bersamaan | Optimistic lock: cek `verification_status` belum berubah sejak dibuka, tolak aksi kedua jika sudah diproses verifikator lain |
| Provider Zoom/Meet API down saat generate link | Fallback otomatis ke Jitsi Internal, atau beri opsi retry manual ke dosen |
| Nilai sudah dipublikasi ke SIAKAD lalu dosen mau koreksi | Perlu endpoint `grade.correction` terpisah (bukan overwrite biasa) — SIAKAD memutuskan apakah revisi ini masih diterima berdasarkan masa sanggah nilai |
