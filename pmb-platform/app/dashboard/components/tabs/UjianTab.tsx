"use client";

import Link from "next/link";

interface UjianTabProps {
  paymentStatus: "unpaid" | "processing" | "paid";
  triggerToast: (msg: string) => void;
}

export default function UjianTab({
  paymentStatus,
  triggerToast,
}: UjianTabProps) {
  const isReady = paymentStatus === "paid";

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Ujian Computer Based Test (CBT) Online
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tes Potensi Akademik (TPA) & Bahasa Inggris Online PMB UNSIA.
          </p>
        </div>
        <button
          onClick={() => triggerToast("Memperbarui status pendaftaran CBT...")}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          💻 Ruang Ujian CBT PMB
        </h3>
        {isReady ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <p className="text-emerald-900 font-bold">
              ✓ Anda berhak mengikuti ujian CBT PMB Online.
            </p>
            <Link
              href="/exam"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
            >
              🚀 Mulai Ujian CBT Sekarang →
            </Link>
          </div>
        ) : (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-bold">
            ⚠️ Selesaikan pembayaran formulir untuk membuka akses ujian CBT.
          </div>
        )}
      </div>
    </div>
  );
}
