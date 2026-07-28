"use client";

interface PembayaranPanelProps {
  applicants: any[];
  triggerToast: (msg: string) => void;
}

export default function PembayaranPanel({ applicants, triggerToast }: PembayaranPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Verifikasi Pembayaran Formulir & Registrasi Ulang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi langsung dengan Modul Keuangan & Billing Virtual Account.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">No. Reg</th>
              <th className="px-4 py-3">Nama Pendaftar</th>
              <th className="px-4 py-3">Jalur Masuk</th>
              <th className="px-4 py-3">Nominal Tagihan</th>
              <th className="px-4 py-3 text-center">Status Pembayaran</th>
              <th className="px-4 py-3 text-right">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applicants.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-blue-700">{a.registrationNumber}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{a.fullName}</td>
                <td className="px-4 py-3">{a.entryPath}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-800">
                  {a.entryPathFee || "Rp 350.000"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${a.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {a.paymentStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => triggerToast(`Pembayaran formulir ${a.fullName} diverifikasi LUNAS!`)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Verifikasi Lunas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
