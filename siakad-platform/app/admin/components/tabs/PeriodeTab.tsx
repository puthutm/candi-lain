"use client";

import { ModalType } from "../AdminModals";

interface PeriodeTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function PeriodeTab({
  setActiveModal,
  triggerToast,
}: PeriodeTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">📅</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Master · Periode Akademik
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Periode Akademik (Semester)</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Setiap Tahun Ajaran terdiri dari periode Ganjil & Genap. Setting periode ini otomatis mempengaruhi pendaftaran KRS, pembuatan kelas, jadwal sesi, dan kalender akademik mahasiswa.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_periode")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Periode
          </button>
        </div>
      </div>

      {/* Active Period Card */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">
                Periode Ganjil 2026/2027 (P-2026-GANJIL)
              </h3>
              <p className="text-xs text-slate-500">01 Sep 2026 – 15 Feb 2027 (16 Sesi Pertemuan Wajib)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
            ● Periode Berjalan (Aktif)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masa Pengisian KRS</span>
            <p className="font-bold text-slate-800 text-sm">15 Aug – 29 Aug 2026</p>
            <p className="text-emerald-600 font-semibold">✓ Selesai Terverifikasi</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masa Perkuliahan</span>
            <p className="font-bold text-slate-800 text-sm">01 Sep – 20 Des 2026</p>
            <p className="text-emerald-600 font-semibold">● Minggu ke-10 Berjalan</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jadwal UTS</span>
            <p className="font-bold text-slate-800 text-sm">27 Okt – 07 Nov 2026</p>
            <p className="text-amber-600 font-semibold">📌 Nilai 92% Masuk</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jadwal UAS</span>
            <p className="font-bold text-slate-800 text-sm">12 Jan – 23 Jan 2027</p>
            <p className="text-slate-500 font-semibold">⏳ Mendatang</p>
          </div>
        </div>

        {/* National Holidays & Academic Activities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-slate-700 mb-2">🌴 Libur Nasional Periodik:</h4>
            <ul className="space-y-1 text-slate-600 font-medium">
              <li>• 17 Aug 2026 — Hari Kemerdekaan RI</li>
              <li>• 10 Sep 2026 — Maulid Nabi Muhammad SAW</li>
              <li>• 25 Des 2026 — Hari Raya Natal</li>
              <li>• 01 Jan 2027 — Tahun Baru Masehi</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-2">📌 Agenda Aktivitas Akademik:</h4>
            <ul className="space-y-1 text-slate-600 font-medium">
              <li>• Pendaftaran Maba Gelombang 1: 01–30 Jun 2026</li>
              <li>• Daftar Ulang Mahasiswa: 15–29 Aug 2026</li>
              <li>• Pengumuman Nilai Akhir KHS: 06 Feb 2027</li>
              <li>• Yudisium Semester Ganjil: 10 Feb 2027</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Past Period Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Periode Genap 2025/2026 (P-2025-GENAP)
            </h3>
            <p className="text-xs text-slate-500">16 Feb 2026 – 31 Aug 2026 (16 Sesi Pertemuan)</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
            Selesai / Terarsip
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Total Mahasiswa Terdaftar: 3.580 Mahasiswa</span>
          <button
            onClick={() => triggerToast("Melihat detail arsip Periode Genap 2025/2026")}
            className="text-[#0f487b] hover:underline font-bold cursor-pointer"
          >
            Detail Kalender & Hasil →
          </button>
        </div>
      </div>
    </div>
  );
}
