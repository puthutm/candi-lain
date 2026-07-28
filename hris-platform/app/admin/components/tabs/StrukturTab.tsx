"use client";

import { OrgUnit, Position } from "../../page";

interface StrukturTabProps {
  units: OrgUnit[];
  positionsList: Position[];
  triggerNotice: (msg: string) => void;
}

export default function StrukturTab({
  units,
  positionsList,
  triggerNotice,
}: StrukturTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Struktur Organisasi Unit Kerja & Jabatan Fungsional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar Fakultas, Program Studi, BAAK, Biro, & Tunjangan Jabatan Dosen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Unit Kerja & Homebase (Fakultas / Biro)
          </h3>
          <div className="space-y-2">
            {units.map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-mono text-purple-700 font-bold text-[10px]">{u.code}</span>
                  <p className="font-bold text-slate-800 text-xs">{u.name}</p>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] uppercase font-bold">
                  {u.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Jabatan Fungsional & Tunjangan
          </h3>
          <div className="space-y-2">
            {positionsList.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-mono text-slate-500 font-bold text-[10px]">{p.abbreviation}</span>
                  <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  Rp {Number(p.functionalAllowance || 0).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
