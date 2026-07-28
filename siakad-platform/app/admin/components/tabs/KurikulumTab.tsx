"use client";

import { ModalType } from "../AdminModals";

interface KurikulumTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function KurikulumTab({
  setActiveModal,
  triggerToast,
}: KurikulumTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">🌳</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Master · Kurikulum Prodi
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Kurikulum Program Studi</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Master kurikulum resmi per program studi. Setiap kurikulum berisi daftar mata kuliah wajib & pilihan beserta struktur SKS dan distribusi semester.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_kurikulum")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Kurikulum
          </button>
        </div>
      </div>

      {/* 2x4 Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* 1. S1 IF */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Informatika 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">42 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Informatika")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 56 Mata Kuliah →
          </button>
        </div>

        {/* 2. S1 SI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Sistem Informasi 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">40 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Sistem Informasi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 54 Mata Kuliah →
          </button>
        </div>

        {/* 3. S1 MJ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Manajemen 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">38 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Manajemen")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 52 Mata Kuliah →
          </button>
        </div>

        {/* 4. S1 AK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Akuntansi 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">38 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Akuntansi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 52 Mata Kuliah →
          </button>
        </div>

        {/* 5. S1 Psikologi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">PSI · KUR-2024</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Psikologi 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">36 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Psikologi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 50 Mata Kuliah →
          </button>
        </div>

        {/* 6. S2 MM */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024 (Pasca)</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S2 Magister Manajemen 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">42</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">10 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">4 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK S2 Magister Manajemen")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 14 Mata Kuliah →
          </button>
        </div>

        {/* 7. S2 MIK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024 (Pasca)</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S2 Magister Ilmu Komputer 2024</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">42</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">10 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">4 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka katalog MK S2 Magister Ilmu Komputer")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 14 Mata Kuliah →
          </button>
        </div>

        {/* 8. S1 IF 2020 Phase Out */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 opacity-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FTI · KUR-2020</span>
              <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Informatika 2020</h3>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
              Phase-Out
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">146</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-slate-700 text-sm">44 MK</span></div>
            <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-slate-700 text-sm">14 MK</span></div>
          </div>
          <button onClick={() => triggerToast("Membuka arsip Kurikulum S1 Informatika 2020")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer">
            Lihat 58 Mata Kuliah →
          </button>
        </div>
      </div>
    </div>
  );
}
