# Business Requirements Document (BRD)
## LMS ICEMS — Learning Management System, Universitas Siber Asia

| Metadata | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 12 Juli 2026 |
| Terkait | SIAKAD UNSIA (sumber data akademik), SSO Platform (identitas) |
| Sumber | Reverse-engineering mockup: `LMS_DOSEN_DAN_MAHASISWA.html`, `newlms.html`, `ICEMS_SESI_-_DOsen.html`, `ICEMS_tampilan_detial_SESI.html`, `ICEMS_Diskusi_-_MAHASISWA.html`, `target_LMS_2_minggu.html`, dan varian tampilan detail sesi |

## 1. Ringkasan Bisnis

LMS ICEMS adalah platform pembelajaran digital yang mengubah mata kuliah yang sudah terjadwal di SIAKAD menjadi **kelas digital interaktif** — tempat dosen mengelola materi, tugas, kuis, video pembelajaran, dan sesi tatap muka virtual, serta tempat mahasiswa mengakses seluruh materi tersebut dan berinteraksi dalam satu linimasa diskusi per kelas.

## 2. Latar Belakang & Problem Statement

Berdasarkan `target_LMS_2_minggu.html`, ada target eksekusi ketat (go-live 23 Juli 2025) dengan 3 pilar: **Integrasi Data Otomatis** dari SIAKAD, **Aktivasi Fitur Dosen**, dan **Aktivasi Akses Mahasiswa**. Ini menunjukkan LMS dibangun sebagai **lapisan pembelajaran di atas data akademik yang sudah ada**, bukan sistem akademik baru — karenanya sinkronisasi otomatis (bukan input manual ulang) adalah kebutuhan inti, bukan fitur tambahan.

## 3. Tujuan Bisnis

- Setiap mata kuliah yang dibuka di SIAKAD otomatis tersedia sebagai kelas digital di LMS — tanpa setup manual oleh dosen atau admin.
- Dosen punya satu tempat terpadu untuk mengelola seluruh bahan ajar (materi, tugas, kuis, video interaktif, live conference) dan menilai mahasiswa, termasuk anotasi langsung di berkas jawaban.
- Mahasiswa punya pengalaman belajar yang lancar: akses semua kelas dari KRS-nya, ikut sesi live atau tonton rekaman, kerjakan tugas/kuis, dan berdiskusi.
- Ada **kontrol mutu berjenjang** — materi ajar diverifikasi Prodi & BPM (Badan Penjaminan Mutu) sebelum tayang ke mahasiswa, sebagai bagian dari penjaminan mutu akademik.
- Dosen juga bisa membuka **Kelas Personal** (workshop/pelatihan non-akademik) di luar plotting resmi Kaprodi — ekspansi nilai LMS di luar kelas terjadwal.

## 4. Ruang Lingkup

**Termasuk:**
- Sinkronisasi otomatis dari SIAKAD: periode akademik, MK, dosen pengampu, jadwal, peserta (dari KRS).
- Manajemen sesi pembelajaran per pertemuan: materi, tugas, kuis, video interaktif, live conference.
- Linimasa diskusi/forum per kelas dengan like, komentar, mention.
- Live conference terintegrasi (Jitsi Internal/Zoom/Google Meet/Custom Link) dengan presensi otomatis dari kehadiran join.
- Video interaktif dengan penanda pertanyaan di titik waktu tertentu.
- Penilaian tugas dengan anotasi langsung pada berkas jawaban + feedback.
- Rekap nilai (Kehadiran/Tugas/UTS/UAS/Akhir/Huruf) per mahasiswa per kelas.
- Verifikasi materi berjenjang: Prodi → BPM sebelum terbit.
- Kelompok diskusi/tugas (pembentukan otomatis/manual).
- Kelas Personal (non-akademik, dikelola bebas oleh dosen).
- Duplikasi bahan ajar dari periode sebelumnya.
- AI Assistant per mata kuliah.
- Notifikasi lintas kanal (LMS, email, WhatsApp).

**Tidak termasuk (di luar scope LMS, ranah SIAKAD):**
- Penerbitan KRS, kurikulum, dan data akademik resmi — LMS hanya **konsumen** data ini, bukan pengelola.
- Nilai akhir semester resmi transkrip — LMS adalah tempat **input & proses** nilai, tapi status "resmi tercatat di transkrip" tetap domain SIAKAD (lihat §7 PRD utk batas integrasi).

## 5. Stakeholder / Aktor

| Aktor | Kepentingan |
|---|---|
| Dosen | Kelola bahan ajar, sesi, penilaian untuk kelas akademik & personal |
| Mahasiswa | Akses materi, kerjakan tugas/kuis, ikut live conference, diskusi |
| Kaprodi (via sinkron SIAKAD) | Plotting dosen jadi dasar kelas otomatis muncul di LMS |
| Prodi (Verifikator Materi) | Verifikasi tahap pertama sebelum materi terbit ke mahasiswa |
| BPM (Badan Penjaminan Mutu) | Verifikasi tahap kedua, penjaminan mutu konten pembelajaran |
| Admin LMS | Monitoring sinkronisasi, pengaturan integrasi (Zoom/Meet API, dsb) |

## 6. Aturan Bisnis (Business Rules)

| # | Aturan |
|---|---|
| BR-01 | Kelas Akademik **tidak bisa dibuat manual** — hanya muncul otomatis dari hasil plotting dosen & KRS di SIAKAD |
| BR-02 | Materi ajar **tidak otomatis tayang** ke mahasiswa — wajib melalui verifikasi Prodi lalu BPM (2 tahap berurutan) |
| BR-03 | Presensi live conference tercatat otomatis saat mahasiswa join — tidak perlu absen manual |
| BR-04 | Mahasiswa yang terdaftar di kelas ditentukan otomatis dari KRS; penambahan manual hanya untuk peran **Observer** (audit) atau **Asisten**, bukan peserta resmi |
| BR-05 | Kelas Personal sepenuhnya di luar plotting Kaprodi — dosen bebas atur akses (undangan/kode/publik), tidak tersinkron ke SIAKAD |
| BR-06 | Dosen bisa menduplikasi bahan ajar dari kelas yang pernah diampunya di periode sebelumnya, mempercepat setup kelas baru |
| BR-07 | Perubahan jadwal/SKS mata kuliah **tidak bisa diedit dari LMS** — harus lewat Kaprodi di SIAKAD (LMS hanya menampilkan, dgn catatan "Hubungi Kaprodi untuk perubahan") |
| BR-08 | Nilai akhir & huruf dihitung dari komponen (Kehadiran/Tugas/UTS/UAS) sesuai bobot yang berlaku — konsisten dengan aturan skala nilai yang sama dipakai SIAKAD (lihat Logic-Aplikasi-SIAKAD.md §7) |

## 7. Metrik Sukses (dari `target_LMS_2_minggu.html`)

| Metrik | Target |
|---|---|
| Tampilan Mata Kuliah (Dosen) | 100% MK terplotting tampil otomatis |
| Adopsi Fitur Kunci Dosen (Materi/Ujian/Tugas/Video/Vicon) | 80% |
| Tampilan Mata Kuliah (Mahasiswa) | 100% |
| Aksesibilitas Konten Mahasiswa | 80% |
| Kriteria Go-Live | Semua mahasiswa akses penuh ke kelasnya; semua dosen punya kelas & bisa unggah materi; semua MK aktif tampil otomatis & terhubung data akademik |

## 8. Risiko Bisnis

| Risiko | Mitigasi |
|---|---|
| Sinkronisasi SIAKAD gagal/telat → kelas tidak muncul saat semester mulai | Job sync berkala + tombol "Sync Manual" darurat utk admin, monitoring status sinkronisasi |
| Materi menumpuk di antrean verifikasi Prodi/BPM, telat terbit ke mahasiswa | SLA verifikasi (misal maks 1x24 jam) + reminder otomatis ke verifikator |
| Ketergantungan pada provider vicon eksternal (Zoom/Meet) — API berubah/kuota habis | Sediakan opsi "Jitsi Internal" sebagai fallback yang dikendalikan sendiri |
| Kelas Personal disalahgunakan (konten tidak sesuai) | Perlu kebijakan moderasi/pelaporan minimal di Fase 2 |

## 9. Roadmap Ringkas

Berdasarkan target 2 minggu di mockup (per tanggal aslinya, dipetakan ulang jadi Fase 1 relatif):

| Fase | Fokus |
|---|---|
| Minggu 1 | Sync data otomatis dari SIAKAD (Pilar 1) + aktivasi modul Dosen: Materi, Tugas, Ujian/Kuis, Video Pembelajaran, Live Conference |
| Minggu 2 | Aktivasi penuh akses Mahasiswa: lihat semua kelas dari KRS, akses materi/tugas/ujian, ikut vicon, putar ulang rekaman |
| Fase 2 (pasca go-live) | Verifikasi berjenjang Prodi/BPM, Kelas Personal, Kelompok, AI Assistant, notifikasi WA/email penuh |
