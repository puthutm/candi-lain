"use client";

interface MonitoringPanelProps {
  applicants: any[];
  waves: any[];
}

export default function MonitoringPanel({ applicants, waves }: MonitoringPanelProps) {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Monitoring Real-time Registrasi Pendaftar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Progres pendaftaran per program studi dan gelombang aktif.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">
          Ringkasan Pendaftar Terdaftar Per Gelombang
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {waves.map((wave) => {
            const count = applicants.filter((a) => a.wave === wave.name).length;
            return (
              <div key={wave.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{wave.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${wave.status === "aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                    {wave.status}
                  </span>
                </div>
                <p className="text-2xl font-black text-[#0f487b] font-display">{count} Pendaftar</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {wave.startDate} s/d {wave.endDate}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
