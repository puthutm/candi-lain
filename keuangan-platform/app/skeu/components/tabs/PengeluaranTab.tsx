"use client";

interface PengeluaranTabProps {
  triggerNotice: (msg: string) => void;
}

export default function PengeluaranTab({ triggerNotice }: PengeluaranTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengeluaran Kas & Anggaran Operasional Kampus
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Persetujuan voucher pengeluaran, gaji dosen/pegawai, & biaya pemeliharaan.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Voucher Pengeluaran Menunggu Persetujuan Direksi</h3>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">VCH-2026-001 · Pembayaran Server Cloud AWS & LMS</span>
              <span className="block text-[11px] text-slate-500 font-mono">Nominal: Rp 45.000.000</span>
            </div>
            <button
              onClick={() => triggerNotice("Voucher VCH-2026-001 disetujui & cair!")}
              className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Cairkan Kas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
