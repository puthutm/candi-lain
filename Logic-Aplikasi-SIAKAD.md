# Logic Aplikasi — SIAKAD UNSIA

| Metadata | Keterangan |
|---|---|
| Terkait | PRD-SIAKAD-UNSIA.md, ERD-SIAKAD-UNSIA.mermaid, Flow-Bisnis-SIAKAD-UNSIA.mermaid |
| Tujuan | Menjabarkan algoritma/aturan bisnis konkret — bukan sekadar alur tingkat tinggi |
| Versi | 1.0 — 12 Juli 2026 |

---

## 1. Konsumsi Event dari PMB — Aktivasi Calon Mahasiswa

Lihat `Logic-Aplikasi-PMB.md §7` untuk sisi pengirim. Ini sisi penerima di SIAKAD.

```
FUNGSI consume_event_applicant_accepted(event):
    # WAJIB idempotent — event bisa terkirim >1 kali (at-least-once delivery)
    JIKA EXISTS students WHERE pmb_applicant_id = event.pmb_applicant_id:
        KELUAR tanpa aksi   # sudah pernah diproses

    INSERT students (
        pmb_applicant_id = event.pmb_applicant_id,
        full_name = event.full_name,
        birth_place = event.birth_place, birth_date = event.birth_date,
        gender = event.gender, address = event.address,
        study_program_id = MAP dari event.study_program_id (via mapping table,
                            karena study_program_id di PMB & SIAKAD adalah UUID BERBEDA
                            — bukan FK yang sama, harus dipetakan berdasarkan kode prodi),
        nim = null,                 # belum terbit, lihat §2
        academic_status = 'calon_mahasiswa',
        entry_path = event.entry_path
    )
    TRIGGER notifikasi ke calon mahasiswa: "Selamat datang, silakan lanjutkan onboarding"
```

**Catatan penting (microservices)**: `study_program_id` di PMB dan di SIAKAD adalah **dua UUID yang berbeda secara fisik** (beda database). Butuh **tabel mapping** (`study_program_code` sebagai kunci yang sama-sama dipakai kedua sistem) atau event dari PMB sebaiknya mengirim **kode prodi** (string, mis. `"TI-S1"`), bukan UUID internal PMB — supaya SIAKAD bisa `SELECT id FROM study_programs WHERE code = 'TI-S1'` di database-nya sendiri.

---

## 2. Generate NIM Otomatis

```
FUNGSI generate_nim(student, tahun_masuk, format_config):
    # format_config dari Pengaturan, contoh komponen: [Tahun(2), KodeProdi(3), Urutan(4)]
    bagian = []
    UNTUK SETIAP komponen DALAM format_config.urutan:
        JIKA komponen.tipe == 'tahun':
            bagian.tambah(str(tahun_masuk)[-komponen.panjang:])
        JIKA komponen.tipe == 'kode_prodi':
            bagian.tambah(student.study_program.code)
        JIKA komponen.tipe == 'counter':
            urutan = COUNT(students WHERE study_program_id = student.study_program_id
                                     AND angkatan = tahun_masuk) + 1
            bagian.tambah(str(urutan).zfill(komponen.panjang))

    nim = GABUNG(bagian)

    JIKA nim SUDAH ADA (race condition):
        ulangi dengan urutan+1 (retry maks 3x, pakai row lock per (prodi, tahun) sama seperti
        generate_registration_number di PMB)

    KEMBALIKAN nim
```

**Dipanggil setelah** pembayaran UKT daftar ulang terkonfirmasi (webhook, pola sama dengan §5 dokumen PMB):
```
FUNGSI on_reregistration_paid(student_id):
    student = GET students WHERE id = student_id
    nim = generate_nim(student, tahun_ini, format_config_aktif)
    UPDATE student.nim = nim
    UPDATE student.academic_status = 'aktif'
    TRIGGER buat KRS perdana (§3, paket wajib) secara otomatis
    TRIGGER notifikasi "NIM Anda: {nim}"
```

---

## 3. KRS Perdana (Onboarding) vs KRS Reguler

**KRS Perdana** — tidak ada pemilihan bebas, sistem auto-isi:
```
FUNGSI buat_krs_perdana(student_id):
    paket_wajib = GET curriculum_courses WHERE curriculum_id = student.curriculum_id
                                          AND semester_offered = 1
    INSERT krs (student_id, academic_period_id=periode_aktif, status='draft')
    UNTUK SETIAP mk DALAM paket_wajib:
        kelas = CARI classes WHERE course_id = mk.course_id
                              AND academic_period_id = periode_aktif
                              AND study_program_id = student.study_program_id
        INSERT krs_items (krs_id, class_id=kelas.id, status='diajukan')
    UPDATE krs.status = 'diajukan'
    PANGGIL kirim_ke_approval_pa(krs.id)   # §4
```

**KRS Reguler** (semester berjalan) — mahasiswa pilih sendiri, lihat §4 untuk validasi.

---

## 4. Validasi & Approval KRS

```
FUNGSI submit_krs(student_id, daftar_class_id):
    student = GET students
    ips_terakhir = GET IPS semester lalu (lihat §7 untuk cara hitung)
    max_sks = HITUNG dari tabel aturan ambang SKS-vs-IPS (dikonfigurasi Admin), contoh:
              IPS >= 3.5  → maks 24 SKS
              IPS >= 3.0  → maks 22 SKS
              IPS >= 2.5  → maks 20 SKS
              default     → maks 18 SKS
              (mahasiswa semester 1 pakai default/paket wajib, bukan aturan ini)

    total_sks = JUMLAH sks dari SETIAP class DALAM daftar_class_id
    JIKA total_sks > max_sks:
        TOLAK — "Melebihi batas maksimal {max_sks} SKS berdasarkan IPS terakhir Anda"

    UNTUK SETIAP class_id DALAM daftar_class_id:
        course = GET course dari class
        UNTUK SETIAP prereq DALAM course.prerequisites (JOIN course_prerequisites):
            JIKA prereq.must_pass DAN TIDAK ADA grades WHERE student_id=student.id
                 AND class.course_id = prereq.prerequisite_course_id
                 AND letter_grade BUKAN ('E','D')  # lulus minimal C, misalnya
                TOLAK — "Prasyarat {prereq.nama} belum lulus"

        kelas = GET classes WHERE id = class_id
        JIKA kelas.enrolled_count >= kelas.capacity:
            JIKA kelas.enrolled_count < kelas.capacity + kelas.waitlist_threshold_open_parallel:
                TAMBAHKAN ke waitlist, status krs_item = 'waitlist'
            LAIN:
                TOLAK item ini — "Kelas & waitlist penuh"

    JIKA semua item valid (atau masuk waitlist):
        INSERT krs (status='diajukan') + krs_items
        PANGGIL kirim_ke_approval_pa(krs.id)
    LAIN:
        KEMBALIKAN daftar error per mata kuliah — mahasiswa revisi (BUKAN reject total,
        item yang valid tetap tersimpan sbg draft)
```

```
FUNGSI kirim_ke_approval_pa(krs_id):
    krs = GET krs
    dosen_pa = GET students.dosen_pa_id WHERE id = krs.student_id
    TRIGGER notifikasi ke dosen_pa: "KRS baru menunggu persetujuan"
    # muncul di Inbox Approval (Portal Dosen §Epic F / Kaprodi §FR-F.2)

FUNGSI proses_approval_krs(krs_id, dosen_pa_id, keputusan, catatan):
    JIKA keputusan == 'reject' DAN catatan KOSONG:
        TOLAK aksi — catatan wajib

    INSERT krs_approvals (krs_id, dosen_pa_id, action=keputusan, note=catatan)

    JIKA keputusan == 'approve':
        UPDATE krs.status = 'disetujui_pa'
        UNTUK SETIAP krs_item DALAM krs (status != 'waitlist'):
            UPDATE classes.enrolled_count += 1  # dalam transaksi, row lock
        UNTUK SETIAP krs_item (status == 'waitlist'):
            UPDATE classes.waitlist_count += 1
        PANGGIL generate_ksm(krs_id)              # §5
        PANGGIL cek_buka_kelas_paralel(krs_id)     # §6

    JIKA keputusan == 'reject':
        UPDATE krs.status = 'ditolak'
        TRIGGER notifikasi ke mahasiswa dengan catatan
        # mahasiswa edit & submit_krs() lagi → krs_id baru, siklus ulang
```

---

## 5. Generate Kartu Studi Mahasiswa (KSM)

```
FUNGSI generate_ksm(krs_id):
    krs = GET krs WITH krs_items, classes, courses
    dokumen = RENDER template KSM (nama, nim, prodi, semester, daftar MK+SKS, total SKS, TTD digital Kaprodi)
    SIMPAN sbg file (PDF) di storage, link ke krs.ksm_file_url
    TRIGGER notifikasi "KSM tersedia, dapat diunduh"
```

---

## 6. Buka Kelas Paralel Otomatis

```
FUNGSI cek_buka_kelas_paralel(krs_id):
    UNTUK SETIAP krs_item DALAM krs (status == 'waitlist'):
        kelas = GET classes WHERE id = krs_item.class_id
        JIKA kelas.waitlist_count >= kelas.waitlist_threshold_open_parallel:
            TRIGGER notifikasi ke Kaprodi: "Kelas {kelas.name} - waitlist penuh, pertimbangkan buka kelas paralel"
            # Fase 1: notifikasi saja, Kaprodi buka manual via Epic D (CRUD classes)
            # Fase lanjutan (opsional): auto-create kelas paralel + auto-assign dosen jika ada aturan jelas
```

---

## 7. Perhitungan Nilai, IPS, dan IPK (Derived Data)

**Nilai akhir per mata kuliah:**
```
FUNGSI hitung_nilai_akhir(student_id, class_id):
    komponen = GET grade_components WHERE class_id = class_id
               (fallback ke bobot default global jika class_id tidak override)
    nilai = GET grades WHERE student_id=student_id AND class_id=class_id

    final_score = SUM UNTUK SETIAP komponen:
                    (nilai[komponen.nama] * komponen.weight_percent / 100)
    # contoh: Tugas 20% + Kuis 10% + UTS 30% + UAS 30% + Kehadiran 10% = 100%

    letter_grade, grade_point = MAP final_score KE skala_nilai (dikonfigurasi Admin), contoh:
                    85-100 → A  (4.0)
                    80-84  → A- (3.7)
                    75-79  → B+ (3.3)
                    70-74  → B  (3.0)
                    ... dst
                    <40    → E  (0.0)

    UPDATE grades.final_score, letter_grade, grade_point
```

**Kunci nilai** (dipicu Admin BAAK/Kaprodi di akhir periode):
```
FUNGSI kunci_nilai_kelas(class_id):
    JIKA ADA mahasiswa DALAM kelas TANPA nilai lengkap (komponen wajib kosong):
        PERINGATKAN admin, minta konfirmasi eksplisit sebelum lanjut
    UPDATE classes.grade_locked = true
    UNTUK SETIAP student DALAM kelas:
        PANGGIL hitung_ulang_ipk_ips(student.id)
```

**IPS (per semester) & IPK (kumulatif):**
```
FUNGSI hitung_ulang_ipk_ips(student_id):
    UNTUK periode TERBARU (semester berjalan yang baru dikunci):
        nilai_periode = GET grades JOIN classes WHERE academic_period_id = periode_ini
                         AND student_id = student_id AND classes.grade_locked = true
        total_mutu = SUM(grade_point * course.sks)
        total_sks_periode = SUM(course.sks)
        ips = total_mutu / total_sks_periode

    seluruh_nilai = GET SEMUA grades mahasiswa ini dari periode yang sudah dikunci
                    # aturan: kalau mata kuliah diulang, PAKAI NILAI TERBAIK, bukan dijumlah 2x
                    UNTUK SETIAP course_id: AMBIL grade_point TERTINGGI antar percobaan
    total_mutu_kumulatif = SUM(grade_point_terbaik * sks) UNTUK SETIAP course unik
    total_sks_lulus = SUM(sks) UNTUK course DENGAN grade_point > 0 (lulus)
    ipk = total_mutu_kumulatif / total_sks_kumulatif_diambil

    UPDATE students.ipk = ipk, total_sks_lulus = total_sks_lulus
    # ips per-semester disimpan terpisah (mis. tabel/summary khs), dipakai utk validasi SKS §4
```

---

## 8. Resolusi Bentrok Jadwal (saat Kaprodi plotting dosen/kelas)

```
FUNGSI cek_bentrok_jadwal(dosen_id, hari, jam_mulai, jam_selesai, exclude_class_id=null):
    jadwal_lain = GET class_schedules JOIN classes
                  WHERE (classes.dosen_utama_id = dosen_id OR EXISTS class_co_teachers dgn dosen_id)
                        AND session_date/hari = hari
                        AND classes.id != exclude_class_id

    UNTUK SETIAP jadwal DALAM jadwal_lain:
        JIKA (jam_mulai < jadwal.end_time) DAN (jam_selesai > jadwal.start_time):
            KEMBALIKAN true  # bentrok

    KEMBALIKAN false
```

Dipanggil setiap kali Kaprodi assign dosen ke kelas atau generate jadwal — jika bentrok, tampilkan pilihan slot alternatif, jangan blok total (beberapa kampus izinkan override manual dengan alasan).

---

## 9. Perubahan Status Akademik (Cuti/DO/Lulus)

```
FUNGSI ajukan_cuti(student_id, alasan, periode_id):
    INSERT letter_request (type='cuti_akademik', student_id, status='diajukan')
    # masuk ke Inbox Approval Kaprodi (sama seperti approval KRS, §4)

FUNGSI setujui_cuti(letter_request_id, kaprodi_id):
    UPDATE letter_request.status = 'selesai'
    UPDATE students.academic_status = 'cuti'
    # mahasiswa cuti TIDAK bisa isi KRS periode tsb — cek ini ditambahkan di submit_krs() §4

FUNGSI cek_kelulusan_otomatis(student_id):
    # dijalankan sbg job berkala, BUKAN real-time — kelulusan tetap perlu SK resmi
    syarat = GET aturan syarat_kelulusan (dikonfigurasi Admin: min total SKS, semua MK wajib lulus, IPK min)
    JIKA students.total_sks_lulus >= syarat.min_sks
        DAN semua_mk_wajib_lulus(student_id)
        DAN students.ipk >= syarat.ipk_min:
        TANDAI sbg "kandidat lulus" — MUNCUL di daftar Kaprodi untuk diverifikasi manual
        # TIDAK auto-update academic_status='lulus' tanpa approval manusia
```

---

## 10. Ringkasan Edge Cases Penting

| Kasus | Penanganan |
|---|---|
| Mahasiswa mengulang MK yang sudah lulus (naikkan nilai) | `hitung_ulang_ipk_ips` pakai nilai terbaik per course, `krs` boleh berisi MK yang sudah pernah lulus jika kebijakan izinkan (dicek via `Pengaturan → Aturan Retake`) |
| Dosen PA tidak merespons approval KRS berhari-hari | Job reminder berkala (mirip §5 PMB) + eskalasi ke Kaprodi jika lewat batas waktu periode KRS |
| Dua mahasiswa submit KRS bersamaan untuk kelas dengan sisa 1 kuota | Row lock pada `classes.enrolled_count` saat approval (bukan saat submit — supaya submit tetap cepat, validasi ketat terjadi di titik approval final) |
| Event `applicant.accepted_and_paid` dari PMB datang duplikat | Idempotency check via `pmb_applicant_id` (§1) |
| Format NIM berubah di tengah tahun akademik (Pengaturan diubah Admin) | NIM yang sudah terbit **tidak berubah**; hanya mahasiswa baru sesudahnya pakai format baru — `format_config` disimpan sbg snapshot per periode, bukan selalu ambil "yang aktif sekarang" |
