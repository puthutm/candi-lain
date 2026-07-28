"use client";

interface PddiktiTabProps {
  triggerToast: (msg: string) => void;
}

export default function PddiktiTab({ triggerToast }: PddiktiTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <h2 className="text-xl font-bold text-slate-800">Sinkronisasi Feeder PDDikti v2.0</h2>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <span className="text-4xl">☁️</span>
        <h3 className="font-bold text-slate-800">UNSIA Feeder Sync Agent</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Sinkronisasikan data mahasiswa, krs, nilai semester & lulusan ke server PDDikti pusat secara otomatis.
        </p>
        <button
          onClick={() => triggerToast("Proses sync PDDikti berhasil dijalankan di latar belakang!")}
          className="px-6 py-2.5 bg-[#0f487b] text-white font-bold text-xs rounded-xl hover:bg-[#00719f] shadow-md cursor-pointer"
        >
          🚀 Jalankan Sync Feeder PDDikti Sekarang
        </button>
      </div>
    </div>
  );
}
