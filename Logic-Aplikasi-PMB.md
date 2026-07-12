# Logic Aplikasi — SI-PMB UNSIA

| Metadata | Keterangan |
|---|---|
| Terkait | PRD-SI-PMB-UNSIA.md, ERD-SI-PMB-UNSIA.mermaid, Flow-Bisnis-SI-PMB-UNSIA.mermaid |
| Tujuan | Menjabarkan algoritma/aturan bisnis konkret yang perlu diimplementasikan di kode — bukan sekadar alur tingkat tinggi |
| Versi | 1.0 — 12 Juli 2026 |

---

## 1. State Machine — Status Pendaftar (`applicants.current_stage`)

```
peminat ──submit wizard──▶ pendaftar ──bayar formulir lunas──▶ isi_biodata
   ──lengkapi biodata & upload semua dokumen wajib──▶ unggah_berkas
   ──semua dokumen "terverifikasi" DAN payment lunas──▶ siap_ujian
   ──mulai modul ujian pertama──▶ sedang_ujian
   ──seluruh modul ujian disubmit──▶ selesai_ujian
   ──keputusan kelulusan──▶ diterima | tidak_lulus
```

**Aturan transisi:**
- Transisi **hanya boleh maju**, kecuali kasus revisi dokumen (`unggah_berkas` bisa "mundur secara logis" — pendaftar tetap di stage yang sama, tapi status dokumen individual berubah jadi `perlu_revisi`).
- Setiap transisi **wajib** mencatat baris baru di `applicant_status_history` (`from_stage`, `to_stage`, `changed_by` — `null` jika dipicu sistem, `note` opsional).
- Transisi ke `siap_ujian` **tidak boleh manual** — hanya dipicu otomatis oleh sistem saat kondisi §3 terpenuhi. Staf tidak punya tombol "buka akses ujian".
- Transisi ke `diterima`/`tidak_lulus` dipicu manual oleh Panitia Akademik/Super Admin setelah melihat `exam_results`, TIDAK otomatis dari skor (butuh keputusan manusia — lihat §6).

---

## 2. Generate Nomor Pendaftaran

```
FUNGSI generate_registration_number(wave, entry_path):
    tahun = wave.start_date.year
    kode_gelombang = wave.code           # contoh: "G1"
    kode_jalur = entry_path.code         # contoh: "REG"
    urutan = COUNT(applicants WHERE wave_id = wave.id) + 1
    nomor = f"{tahun}-{kode_gelombang}-{kode_jalur}-{urutan:04d}"
             # contoh: 2026-G1-REG-0001

    JIKA nomor sudah ada di database (race condition saat submit bersamaan):
        ulangi dengan urutan + 1 (retry maksimal 3x)
        JIKA masih gagal: lempar error, minta user submit ulang

    KEMBALIKAN nomor
```

**Catatan konkurensi**: gunakan **row lock** atau **sequence per (wave_id, entry_path_id)** di database saat increment `urutan`, jangan hanya `COUNT()` biasa — rawan duplikat saat banyak pendaftar submit bersamaan menjelang deadline.

---

## 3. Logic Auto-Unlock Akses Ujian

Dijalankan sebagai **trigger/listener**, dipanggil setiap kali salah satu dari 2 kondisi berubah: status dokumen berubah jadi `terverifikasi`, atau `invoices.status` berubah jadi `paid`.

```
FUNGSI cek_siap_ujian(applicant_id):
    applicant = GET applicant
    JIKA applicant.current_stage != 'unggah_berkas':
        KELUAR   # bukan tahap yang relevan, abaikan

    dokumen_wajib = GET document_types WHERE is_required = true
                    DAN applies_to_rule cocok dgn jalur & prodi applicant

    semua_terverifikasi = SETIAP dokumen_wajib PUNYA
                           applicant_documents.status = 'terverifikasi'

    sudah_lunas = EXISTS invoice WHERE applicant_id = applicant.id
                  DAN invoice_type = 'formulir' DAN status = 'paid'

    JIKA semua_terverifikasi DAN sudah_lunas:
        UPDATE applicant.current_stage = 'siap_ujian'
        INSERT applicant_status_history (from='unggah_berkas', to='siap_ujian', changed_by=null)
        TRIGGER notifikasi "Anda siap mengikuti ujian"
```

**Edge case**: jika ada dokumen baru ditambahkan ke `document_types` setelah pendaftar sudah di tahap ini (mis. persyaratan berubah di tengah gelombang), field `applies_to_rule` menentukan apakah dokumen lama sudah cukup atau perlu ada dokumen tambahan — evaluasi ulang berjalan otomatis lewat trigger yang sama.

---

## 4. Verifikasi Dokumen — Loop Revisi

```
FUNGSI verifikasi_dokumen(document_id, keputusan, catatan, staff_id):
    dokumen = GET applicant_documents WHERE id = document_id

    JIKA keputusan == 'approve':
        UPDATE dokumen.status = 'terverifikasi'
        UPDATE dokumen.verified_by = staff_id, verified_at = now()

    JIKA keputusan == 'revisi':
        JIKA catatan KOSONG:
            TOLAK aksi — catatan wajib diisi saat minta revisi
        UPDATE dokumen.status = 'perlu_revisi'
        UPDATE dokumen.revision_note = catatan
        TRIGGER notifikasi ke pendaftar (email/WA): "Dokumen [X] perlu direvisi: [catatan]"

    PANGGIL cek_siap_ujian(dokumen.applicant_id)   # §3, evaluasi ulang tiap kali ada perubahan
```

**Ketika pendaftar upload ulang** dokumen yang berstatus `perlu_revisi`:
```
FUNGSI upload_ulang_dokumen(document_id, file_baru):
    UPDATE dokumen.file_url = file_baru
    UPDATE dokumen.status = 'menunggu_verifikasi'
    UPDATE dokumen.revision_note = null
    KEMBALIKAN ke antrean verifikasi (masuk lagi ke Epic Verifikasi Berkas)
```

---

## 5. Payment — Idempotency Webhook

**Masalah**: payment gateway bisa mengirim webhook konfirmasi lebih dari sekali (*at-least-once delivery*) — tanpa penanganan, status bisa ter-update berkali-kali atau memicu notifikasi duplikat.

```
FUNGSI handle_payment_webhook(payload):
    provider_ref = payload.transaction_id

    JIKA EXISTS payment_transactions WHERE provider_ref = provider_ref:
        transaksi_lama = GET payment_transactions WHERE provider_ref = provider_ref
        JIKA transaksi_lama.status == payload.status:
            KELUAR tanpa aksi   # sudah diproses sebelumnya, idempotent — return 200 OK ke gateway

    VALIDASI signature/checksum webhook (cegah spoofing)
    JIKA signature tidak valid:
        TOLAK dgn 401, JANGAN proses

    INSERT ATAU UPDATE payment_transactions (provider_ref, status, paid_at, webhook_payload)

    JIKA payload.status == 'success':
        UPDATE invoice.status = 'paid'
        UPDATE applicant.payment_status = 'lunas'
        PANGGIL cek_siap_ujian(applicant_id)   # §3
        TRIGGER notifikasi "Pembayaran terkonfirmasi"

    RETURN 200 OK   # selalu balas 200 walau data sudah ada, supaya gateway berhenti retry
```

**Reminder otomatis (H+3 belum bayar)** — dijalankan sebagai scheduled job harian:
```
FUNGSI job_harian_reminder_pembayaran():
    UNTUK SETIAP invoice WHERE status = 'unpaid' DAN invoice_type = 'formulir'
                          DAN created_at <= now() - 3 hari
                          DAN belum pernah dikirim reminder hari ini:
        TRIGGER kirim email/WA reminder
        CATAT di message_logs
```

---

## 6. Ujian CBT — Timer, Auto-save, Auto-submit

```
SAAT mahasiswa mulai modul ujian:
    INSERT exam_session (status='draf', started_at=now(),
                          time_remaining_seconds = exam_module.duration_minutes * 60)

SETIAP jawaban diisi/diubah (client-side, throttled tiap ±5 detik):
    UPSERT exam_answer (session_id, question_id, answer_value, answered_at)
    # auto-save — tidak menunggu tombol submit

SETIAP interval polling dari client (mis. tiap 10 detik):
    hitung_mundur = exam_session.started_at + exam_module.duration_minutes*60 - now()
    JIKA hitung_mundur <= 0 DAN exam_session.status == 'draf':
        PANGGIL auto_submit(session_id)

FUNGSI auto_submit(session_id):
    UPDATE exam_session.status = 'selesai_dikumpulkan'
    UPDATE exam_session.submitted_at = now()
    PANGGIL hitung_skor(session_id)   # jika soal pilihan ganda, skor bisa langsung dihitung otomatis

FUNGSI submit_manual(session_id):
    # sama seperti auto_submit, tapi dipicu user klik tombol "Selesai"
    JIKA exam_session.status != 'draf':
        TOLAK — sesi sudah berakhir
    PANGGIL auto_submit(session_id)
```

**Setelah semua modul untuk applicant tsb berstatus `selesai_dikumpulkan`:**
```
JIKA SETIAP exam_module aktif SUDAH punya exam_session.status = 'selesai_dikumpulkan' UNTUK applicant ini:
    UPDATE applicant.current_stage = 'selesai_ujian'
    INSERT applicant_status_history
```

**Keputusan kelulusan (manual, bukan otomatis dari skor)** — Panitia Akademik melihat `exam_results` lalu:
```
FUNGSI putuskan_kelulusan(applicant_id, keputusan, staff_id):
    JIKA keputusan == 'lulus':
        UPDATE applicant.current_stage = 'diterima'
        GENERATE acceptance_letter (PDF)
        TRIGGER event (untuk konsumsi service lain, mis. SIAKAD) — lihat §7
    JIKA keputusan == 'tidak_lulus':
        UPDATE applicant.current_stage = 'tidak_lulus'
        TRIGGER notifikasi hasil
    INSERT applicant_status_history (changed_by = staff_id)
```

---

## 7. Integrasi Keluar — Event ke SIAKAD (microservices, lihat Catatan-Arsitektur-Microservices.md)

```
SAAT applicant.current_stage berubah jadi 'diterima' DAN daftar_ulang lunas (event terpisah dari SIAKAD, lihat dok SIAKAD §2):
    PUBLISH event "applicant.accepted_and_paid" KE event bus/webhook, BERISI:
        {
          pmb_applicant_id, full_name, nik, birth_place, birth_date, gender,
          address, study_program_id, entry_path_id, wave_id,
          verified_documents: [...],  # snapshot, bukan link ke DB PMB
          email, phone
        }
    # PMB TIDAK tahu dan TIDAK peduli bagaimana SIAKAD memprosesnya —
    # decoupling penuh sesuai prinsip microservices.

    SIMPAN log pengiriman event (event_id, payload_hash, status: terkirim/gagal, retry_count)
    JIKA gagal terkirim (SIAKAD service down): retry dengan exponential backoff, maks N kali,
         lalu masuk dead-letter queue utk investigasi manual
```

---

## 8. Kuota Gelombang & Prodi

```
FUNGSI cek_kuota_tersedia(wave_id, study_program_id):
    quota = GET quotas WHERE wave_id = wave_id AND study_program_id = study_program_id
    KEMBALIKAN quota.quota_filled < quota.quota_total

# Dipanggil saat wizard pendaftaran submit (langkah pemilihan prodi):
SAAT applicant baru disimpan DENGAN study_program_id tertentu:
    JIKA TIDAK cek_kuota_tersedia(wave_id, study_program_id):
        TOLAK submit — tampilkan pesan "Kuota prodi ini di gelombang ini sudah penuh"
    JIKA LULUS:
        INCREMENT quota.quota_filled (atomic, dalam transaksi yang sama dgn INSERT applicant)
```

**Catatan race condition**: increment `quota_filled` dan insert `applicant` harus dalam **satu transaksi database** dengan row-level locking (`SELECT ... FOR UPDATE` pada baris quota) supaya dua submit bersamaan tidak sama-sama lolos saat kuota tersisa 1.

---

## 9. Ringkasan Edge Cases Penting

| Kasus | Penanganan |
|---|---|
| Pendaftar submit wizard 2x dengan email sama | Cek unique constraint `applicants.email`; jika sudah ada & belum bayar, arahkan ke login bukan bikin akun baru |
| Webhook payment gateway terlambat/gagal terkirim | Job harian "rekonsiliasi" yang query status transaksi langsung ke API gateway untuk invoice yang masih `unpaid` > 1 hari |
| Dosen/staf verifikasi dokumen yang sudah dihapus/diganti pendaftar | Lock optimistic — cek `dokumen.file_url` belum berubah sejak staf buka halaman verifikasi, kalau berubah tolak aksi & minta refresh |
| Ujian ditinggal browser crash / tutup tab | `time_remaining_seconds` dihitung dari `started_at` server-side (bukan dari timer client), sehingga auto-submit tetap jalan via job scheduler walau client tidak aktif |
