"use client";

import { TuitionRate } from "../../page";

interface PengaturanTabProps {
  rates: TuitionRate[];
  triggerNotice: (msg: string) => void;
}

export default function PengaturanTab({ rates, triggerNotice }: PengaturanTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Setting Master Tarif SPP & BOP Per Program Studi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi besaran SPP, BOP, & persetujuan Yayasan per semester.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">Program Studi</th>
              <th className="px-4 py-3 font-mono">Periode</th>
              <th className="px-4 py-3 text-right">Tarif SPP</th>
              <th className="px-4 py-3 text-right">Tarif BOP</th>
              <th className="px-4 py-3 text-right">Total UKT</th>
              <th className="px-4 py-3 text-center">Approval Yayasan</th>
              <th className="px-4 py-3 text-right">Aksi Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {rates.map((rate) => (
              <tr key={rate.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-sans font-bold text-slate-800">{rate.studyProgramNameSnapshot}</td>
                <td className="px-4 py-3 font-mono text-[11px]">{rate.academicPeriodLabel}</td>
                <td className="px-4 py-3 text-right">
                  Rp {Number(rate.sppAmount || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  Rp {Number(rate.bopAmount || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#0f487b]">
                  Rp {Number(rate.totalAmount || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-center font-sans">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                    {rate.requiresYayasanApproval ? "Disetujui Yayasan" : "Tidak Perlu"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-sans">
                  <button
                    onClick={() => triggerNotice(`Edit tarif ${rate.studyProgramNameSnapshot}`)}
                    className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
