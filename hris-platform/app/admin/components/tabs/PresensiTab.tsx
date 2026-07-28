"use client";

interface PresensiTabProps {
  triggerNotice: (msg: string) => void;
}

export default function PresensiTab({ triggerNotice }: PresensiTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Presensi & Validasi Beban Kerja Dosen (BKD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi absensi online & rekap jam perkuliahan S1/S2 ke SIAKAD.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Rekapitulasi Kehadiran & Jam BKD Semester Ganjil 2026/2027</h3>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800">Dr. Aulia Rahman, M.Kom. (FTI)</span>
            <span className="block text-[11px] text-slate-500 font-mono">
              Beban Mengajar: 12 Jam/Mgg · Kehadiran 100% (16/16 Sesi)
            </span>
          </div>
          <button
            onClick={() => triggerNotice("BKD Dr. Aulia Rahman terverifikasi & ter-sync ke PDDikti!")}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Verifikasi BKD
          </button>
        </div>
      </div>
    </div>
  );
}
