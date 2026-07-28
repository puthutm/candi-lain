"use client";

import { ModalType } from "../AdminModals";
import { AdminTab } from "../AdminSidebar";

interface TahunAjaranTabProps {
  setActiveModal: (modal: ModalType) => void;
  setActiveTab: (tab: AdminTab) => void;
  triggerToast: (msg: string) => void;
}

export default function TahunAjaranTab({
  setActiveModal,
  setActiveTab,
  triggerToast,
}: TahunAjaranTabProps) {
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
                Master · Tahun Ajaran
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Tahun Ajaran UNSIA</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Master tahun ajaran berformat <strong>YYYY/YYYY</strong> saja (misal 2026/2027). Setting Ganjil/Genap dan detail kalender akademik dikelola di menu <strong>Periode Akademik</strong>.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_ta")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Tahun Ajaran
          </button>
        </div>
      </div>

      {/* Info Callout Box (Req #12) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <span className="text-blue-600 text-base font-bold shrink-0">ℹ️</span>
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>Catatan Sesuai Aturan Kemenristekdikti:</strong> Tahun Ajaran hanya menyimpan format tahun saja (misal <strong>2026/2027</strong>). Pemecahan menjadi semester Ganjil & Genap dilakukan di menu <strong>Periode Akademik</strong> yang berisi tanggal kuliah, UTS, UAS, libur nasional, dan kalender aktivitas akademik per semester.
        </p>
      </div>

      {/* Card Grid Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TA 2026/2027</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif Berjalan
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-display">2026 / 2027</h3>
          <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
            <p>• Periode Ganjil & Genap</p>
            <p>• Total Mahasiswa: 3.719</p>
          </div>
          <button
            onClick={() => setActiveTab("periode")}
            className="w-full mt-2 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Kelola Periode →
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TA 2025/2026</span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
              Selesai
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-display">2025 / 2026</h3>
          <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
            <p>• Periode Ganjil & Genap</p>
            <p>• Total Mahasiswa: 3.580</p>
          </div>
          <button
            onClick={() => triggerToast("Melihat arsip TA 2025/2026")}
            className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Lihat Arsip →
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TA 2024/2025</span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
              Arsip
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-display">2024 / 2025</h3>
          <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
            <p>• Periode Ganjil & Genap</p>
            <p>• Total Mahasiswa: 3.240</p>
          </div>
          <button
            onClick={() => triggerToast("Melihat arsip TA 2024/2025")}
            className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Lihat Arsip →
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TA 2023/2024</span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
              Arsip
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-display">2023 / 2024</h3>
          <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
            <p>• Periode Ganjil & Genap</p>
          </div>
          <button
            onClick={() => triggerToast("Melihat arsip TA 2023/2024")}
            className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Lihat Arsip →
          </button>
        </div>
      </div>
    </div>
  );
}
