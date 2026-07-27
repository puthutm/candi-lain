"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  status: "unpaid" | "paid" | "overdue";
  items: { itemName: string; amount: number }[];
}

export default function SkeumStudentPortal() {
  const [data, setData] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/skeum/data");
      const result = await res.json();
      if (result.success) {
        setData(result.data || {});
        setInvoices(result.data?.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleSimulatePay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch("/api/skeum/simulate-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const result = await res.json();
      if (result.success) {
        setToast("Pembayaran berhasil dikonfirmasi! E-Kuitansi telah diterbitkan.");
        await fetchStudentData();
      } else {
        setToast(result.error || "Gagal melakukan pembayaran");
      }
    } catch (err: any) {
      setToast(err.message);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Portal SKEUM (Keuangan Mahasiswa)</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Sistem Evaluasi & Pembayaran UKT/SPP Mandiri UNSIA</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700">
              UNSIA Finansial
            </span>
            <a
              href="/skeum/pengajuan"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-md transition"
            >
              📝 Ajukan Keringanan
            </a>
          </div>
        </header>

        {/* Clearance Card Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Status Clearance Finansial</span>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  data?.clearanceStatus === "aktif"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {data?.clearanceStatus === "aktif" ? "✓ AKTIF (BEBAS TUNGGAKAN)" : "⚠️ TERTAHAN (OVERDUE)"}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Total Tagihan Aktif</span>
            <span className="text-2xl font-black text-white font-mono">
              Rp {(data?.totalUnpaid || 0).toLocaleString("id-ID")}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">Total Terbayarkan</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              Rp {(data?.totalPaid || 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📑</span> Tagihan & Riwayat Pembayaran SPP/UKT
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat tagihan mahasiswa...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Belum ada tagihan terdaftar untuk periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 px-2">No Invoice</th>
                    <th className="pb-3 px-2">Periode / Jenis</th>
                    <th className="pb-3 px-2">Jatuh Tempo</th>
                    <th className="pb-3 px-2">Nominal (Rp)</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-2 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-2">{inv.period}</td>
                      <td className="py-3.5 px-2 font-mono text-slate-400">{inv.dueDate}</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-400">
                        Rp {Number(inv.totalAmount).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : inv.status === "overdue"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {inv.status === "paid" ? "LUNAS" : inv.status === "overdue" ? "TERLAMBAT" : "BELUM BAYAR"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {inv.status === "paid" ? (
                          <a
                            href={`/api/skeum/kuitansi/${inv.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1"
                          >
                            📄 E-Kuitansi
                          </a>
                        ) : (
                          <button
                            onClick={() => handleSimulatePay(inv.id)}
                            disabled={payingId === inv.id}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition shadow-md flex items-center gap-1.5 ml-auto"
                          >
                            {payingId === inv.id ? "Memproses..." : "💳 Bayar Sekarang"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">
          ✨ {toast}
        </div>
      )}
    </div>
  );
}
