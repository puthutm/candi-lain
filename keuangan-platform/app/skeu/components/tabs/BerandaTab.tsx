"use client";

interface BerandaTabProps {
  invoicesCount: number;
  paymentsCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  setShowClearanceModal: (show: boolean) => void;
  triggerNotice: (msg: string) => void;
}

export default function BerandaTab({
  invoicesCount,
  paymentsCount,
  totalRevenue,
  totalOutstanding,
  setShowClearanceModal,
  triggerNotice,
}: BerandaTabProps) {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Console Keuangan & Kas Kampus
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan arus kas penerimaan UKT, pendaftaran PMB, & log payment gateway.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClearanceModal(true)}
            className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl hover:bg-amber-100 shadow-2xs cursor-pointer"
          >
            🔍 Cek Financial Clearance NIM
          </button>
          <button
            onClick={() => triggerNotice("Refreshed data keuangan kampus!")}
            className="px-4 py-2 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            Total Penerimaan UKT
          </span>
          <p className="font-display font-black text-2xl text-emerald-700 font-mono">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Terverifikasi Lunas</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">
            Total Tunggakan UKT
          </span>
          <p className="font-display font-black text-2xl text-rose-700 font-mono">
            Rp {totalOutstanding.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px] text-rose-600 font-bold">Batas Pengisian KRS</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Total Invoice Diterbitkan
          </span>
          <p className="font-display font-black text-3xl text-slate-800">
            {invoicesCount}
          </p>
          <p className="text-[10px] text-slate-500 font-bold">Semester Ganjil 2026/2027</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
            Transaksi Payment Gateway
          </span>
          <p className="font-display font-black text-3xl text-blue-700">
            {paymentsCount}
          </p>
          <p className="text-[10px] text-blue-600 font-bold">Midtrans / Xendit / VA</p>
        </div>
      </div>
    </div>
  );
}
