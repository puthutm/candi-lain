"use client";

interface PengumumanTabProps {
  paymentStatus: "unpaid" | "processing" | "paid";
  candidateName: string;
  prodiName: string;
  triggerToast: (msg: string) => void;
}

export default function PengumumanTab({
  paymentStatus,
  candidateName,
  prodiName,
  triggerToast,
}: PengumumanTabProps) {
  const isPassed = paymentStatus === "paid";

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Hasil Seleksi Penerimaan Mahasiswa Baru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengumuman kelulusan resmi & Surat Keputusan (SK) Rektor.
          </p>
        </div>
        <button
          onClick={() => triggerToast("Mengunduh SK Kelulusan PMB (PDF)...")}
          className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          📄 Download SK Kelulusan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          📜 Pengumuman Hasil Kelulusan Seleksi
        </h3>
        {isPassed ? (
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl space-y-2 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded">
              LULUS SELEKSI PMB
            </span>
            <h4 className="text-lg font-black">{candidateName || "Budi Santoso"}</h4>
            <p className="text-xs font-medium">
              Selamat! Anda Dinyatakan LULUS di Program Studi <span className="font-bold underline">{prodiName || "S1 Informatika"}</span>.
            </p>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-bold">
            Hasil seleksi akan diumumkan setelah seluruh tahapan ujian diselesaikan.
          </div>
        )}
      </div>
    </div>
  );
}
