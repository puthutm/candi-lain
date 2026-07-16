# TODO PMB - Samakan Menu & Hilangkan Hard-code/Dummy

## Checklist
- [x] Hapus seed mock dipanggil dari client (hapus `/api/seed` call di `app/page.tsx`).
- [x] Hapus hard-code `GELOMBANG/JALUR/PRODI` di `app/page.tsx`; inisialisasi state kosong dan isi dari `/api/meta`.
- [x] Hapus fallback dummy saat login kandidat tidak ditemukan.
- [x] Samakan menu kandidat di `app/dashboard/page.tsx` sesuai source-of-truth: `dashboard -> tagihan -> data -> ujian -> pengumuman` (pengumuman disabled).
- [x] Hilangkan dokumen hard-code di `app/dashboard/page.tsx`; gunakan `data.documents` dari `/api/applicants/[id]`.
- [x] Hilangkan invoice number hard-code dan pembayaran simulasi yang memaksa status.

- [x] Hapus dummy constants exam (`MODULES_DATA`, `QUESTIONS_TPA`, `PLATES_COLOR`) di `app/exam/page.tsx`.
- [x] Pastikan modul & soal exam 100% dari endpoint `/api/exam/modules`, `/api/exam/questions`, dan `/api/exam/submit` (grading di server).
- [x] Lengkapi endpoint profile: hubungkan form biodata di `app/dashboard/page.tsx` (tab "data") dengan `/api/applicants/profile` — state biodata terpakai penuh, ada handler simpan & re-fetch stage.
- [x] Jalankan build (`npm run build`) — LOLOS, semua route ter-generate tanpa type error. (lint via `eslint` masih error dependency, tapi type-check build clean.)

