"use client";

import { useState } from "react";

interface PembayaranPanelProps {
  applicants: any[];
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
}

export default function PembayaranPanel({ applicants, triggerToast, refreshData }: PembayaranPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleVerifyPayment = async (applicantId: string, fullName: string) => {
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, paymentStatus: "lunas" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Pembayaran pendaftar ${fullName} berhasil diverifikasi LUNAS!`);
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal memverifikasi pembayaran: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

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
                <td className="px-4 py-3 font-semibold text-slate-700">{a.entryPath}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-800">
                  {a.entryPathFee ? `Rp ${Number(a.entryPathFee).toLocaleString("id-ID")}` : "Rp 350.000"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      a.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {a.paymentStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={loadingId === a.id || a.paymentStatus === "lunas"}
                    onClick={() => handleVerifyPayment(a.id, a.fullName)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {loadingId === a.id ? "Memproses..." : a.paymentStatus === "lunas" ? "✓ Lunas" : "Verifikasi Lunas"}
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
