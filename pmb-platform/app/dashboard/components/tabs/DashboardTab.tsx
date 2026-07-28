"use client";

interface DashboardTabProps {
  candidateName: string;
  prodiName: string;
  entryPathName: string;
  paymentStatus: "unpaid" | "processing" | "paid";
  currentStage: string;
  triggerToast: (msg: string) => void;
}

export default function DashboardTab({
  candidateName,
  prodiName,
  entryPathName,
  paymentStatus,
  currentStage,
  triggerToast,
}: DashboardTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Selamat Datang, {candidateName || "Calon Mahasiswa"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilihan Prodi: <span className="font-bold text-slate-800">{prodiName || "S1 Informatika"}</span> · Jalur: <span className="font-bold text-slate-800">{entryPathName || "Reguler Ganjil"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerToast("Dashboard PMB diperbarui!")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full cursor-pointer"
          >
            🔄 Refresh
          </button>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
            ● Tahap PMB: {currentStage || "Pembayaran Formulir"}
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          🗺️ Alur Pendaftaran PMB UNSIA 2026
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 font-bold">
          <span className={`px-3 py-2 rounded-xl shrink-0 ${paymentStatus === "paid" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {paymentStatus === "paid" ? "✓ 1. Bayar Formulir (Lunas)" : "1. Bayar Formulir (Pending)"}
          </span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">2. Isi Biodata & Berkas</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">3. Ujian CBT Online</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">4. Kelulusan & Daftar Ulang</span>
        </div>
      </div>
    </div>
  );
}
