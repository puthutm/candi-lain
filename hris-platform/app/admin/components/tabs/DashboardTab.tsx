"use client";

interface DashboardTabProps {
  employeesCount: number;
  leaveRequestsCount: number;
  dosenCount: number;
  tendikCount: number;
  triggerNotice: (msg: string) => void;
}

export default function DashboardTab({
  employeesCount,
  leaveRequestsCount,
  dosenCount,
  tendikCount,
  triggerNotice,
}: DashboardTabProps) {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Dashboard SDM & Kepegawaian Kampus
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan data Dosen, Tendik, absensi BKD, & pengajuan cuti.
          </p>
        </div>
        <button
          onClick={() => triggerNotice("Refreshed data SDM & HRIS!")}
          className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-xs cursor-pointer"
        >
          🔄 Refresh Dashboard
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Total Pegawai (SDM)
          </span>
          <p className="font-display font-black text-3xl text-slate-800">
            {employeesCount}
          </p>
          <p className="text-[10px] text-purple-600 font-bold">Terdaftar di Sistem HRIS</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
            Dosen Pengampu
          </span>
          <p className="font-display font-black text-3xl text-blue-700">
            {dosenCount}
          </p>
          <p className="text-[10px] text-blue-600 font-bold">Synced ke SIAKAD & BKD</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            Tenaga Kependidikan
          </span>
          <p className="font-display font-black text-3xl text-emerald-700">
            {tendikCount}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Staff Operasional BAAK/Biro</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
            Pengajuan Cuti Pending
          </span>
          <p className="font-display font-black text-3xl text-amber-700">
            {leaveRequestsCount}
          </p>
          <p className="text-[10px] text-amber-600 font-bold">Butuh Persetujuan HRD</p>
        </div>
      </div>
    </div>
  );
}
