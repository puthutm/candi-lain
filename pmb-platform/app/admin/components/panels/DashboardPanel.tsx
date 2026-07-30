"use client";

interface DashboardPanelProps {
  applicantsCount: number;
  unverifiedDocsCount: number;
  acceptedCount: number;
  totalFeesCollected: number;
  triggerToast: (msg: string) => void;
}

export default function DashboardPanel({
  applicantsCount,
  unverifiedDocsCount,
  acceptedCount,
  totalFeesCollected,
  triggerToast,
}: DashboardPanelProps) {
  const total = applicantsCount || 1;
  const berkasCount = Math.max(0, applicantsCount - unverifiedDocsCount);
  const berkasPct = Math.round((berkasCount / total) * 100);
  const cbtPct = Math.round((Math.min(applicantsCount, acceptedCount + berkasCount) / total) * 100);
  const acceptedPct = Math.round((acceptedCount / total) * 100);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Dashboard Penerimaan Mahasiswa Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan statistik real-time registrasi pendaftar & kelulusan PMB.
          </p>
        </div>
        <button
          onClick={() => triggerToast("Memperbarui data analitik PMB...")}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
        >
          🔄 Refresh Analytics
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Total Pendaftar
          </span>
          <p className="font-display font-black text-3xl text-slate-800">
            {applicantsCount}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Seluruh Gelombang Aktif</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
            Berkas Pending
          </span>
          <p className="font-display font-black text-3xl text-amber-700">
            {unverifiedDocsCount}
          </p>
          <p className="text-[10px] text-amber-600 font-bold">Butuh Verifikasi BAAK</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            Lulus & Diterima
          </span>
          <p className="font-display font-black text-3xl text-emerald-700">
            {acceptedCount}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Siap Diberikan NIM</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
            Total Biaya Pendaftaran
          </span>
          <p className="font-display font-black text-2xl text-blue-800 font-mono">
            Rp {totalFeesCollected.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-blue-600 font-bold">Terverifikasi Lunas</p>
        </div>
      </div>

      {/* Conversion Funnel Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>🎯</span> Funnel Konversi Pendaftaran Maba (Dinamis Data Real-Time)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-center font-bold">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-slate-500 block text-[10px]">1. PEMINAT</span>
            <span className="text-xl text-blue-700 font-mono">100%</span>
            <span className="text-[10px] text-slate-500 block font-normal mt-1">{applicantsCount} Akun Terbuat</span>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <span className="text-slate-500 block text-[10px]">2. UNGGAH BERKAS</span>
            <span className="text-xl text-indigo-700 font-mono">{berkasPct}%</span>
            <span className="text-[10px] text-slate-500 block font-normal mt-1">{berkasCount} Terverifikasi</span>
          </div>
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <span className="text-slate-500 block text-[10px]">3. UJIAN CBT</span>
            <span className="text-xl text-violet-700 font-mono">{cbtPct}%</span>
            <span className="text-[10px] text-slate-500 block font-normal mt-1">Selesai Evaluasi</span>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-slate-500 block text-[10px]">4. REGISTRASI ULANG</span>
            <span className="text-xl text-emerald-700 font-mono">{acceptedPct}%</span>
            <span className="text-[10px] text-slate-500 block font-normal mt-1">{acceptedCount} Terbit NIM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
