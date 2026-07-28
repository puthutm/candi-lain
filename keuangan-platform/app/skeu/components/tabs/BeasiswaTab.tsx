"use client";

interface BeasiswaTabProps {
  triggerNotice: (msg: string) => void;
}

export default function BeasiswaTab({ triggerNotice }: BeasiswaTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Beasiswa, Keringanan & Potongan UKT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Persetujuan potongan UKT, skema cicilan, & beasiswa yayasan.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Daftar Pengajuan Keringanan UKT</h3>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">26090182 · Budi Santoso</span>
              <span className="block text-[11px] text-slate-500 font-mono">
                Pengajuan Potongan SPP 50% (Beasiswa Prestasi)
              </span>
            </div>
            <button
              onClick={() => triggerNotice("Beasiswa potongan SPP 50% untuk Budi Santoso disetujui!")}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Setujui Beasiswa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
