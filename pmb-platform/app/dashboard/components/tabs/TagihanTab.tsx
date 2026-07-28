"use client";

interface TagihanTabProps {
  formFee: number;
  paymentStatus: "unpaid" | "processing" | "paid";
  submittingPayment: boolean;
  handleSimulatePayment: () => void;
  triggerToast: (msg: string) => void;
}

export default function TagihanTab({
  formFee,
  paymentStatus,
  submittingPayment,
  handleSimulatePayment,
  triggerToast,
}: TagihanTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Tagihan & Instuksi Pembayaran Formulir PMB
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nominal formulir pendaftaran PMB: Rp {Number(formFee || 350000).toLocaleString("id-ID")}.
          </p>
        </div>
        {paymentStatus === "paid" ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => triggerToast("Memperbarui status pembayaran...")}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              🔄 Refresh
            </button>
            <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              ✓ Status Pembayaran: LUNAS
            </span>
          </div>
        ) : (
          <button
            onClick={handleSimulatePayment}
            disabled={submittingPayment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            💳 Konfirmasi Pembayaran Instant
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          Instruksi Transfer Virtual Account (VA) Bank
        </h3>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Bank Mandiri VA:</span>
            <span className="font-bold text-[#0f487b] text-sm">88001099887766</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bank BCA VA:</span>
            <span className="font-bold text-[#0f487b] text-sm">12900099887766</span>
          </div>
        </div>
      </div>
    </div>
  );
}
