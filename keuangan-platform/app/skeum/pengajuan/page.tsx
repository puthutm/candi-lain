"use client";

import { useState, useEffect } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  status: "unpaid" | "paid" | "overdue";
}

interface ReliefPlan {
  id: string;
  invoiceId: string;
  scheme: string;
  termCount: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function PengajuanKeringananPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<ReliefPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [scheme, setScheme] = useState("cicilan_2x");
  const [reason, setReason] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const statusLabel = (s: string) => (s === "overdue" ? "TERLAMBAT" : "BELUM BAYAR");

  const fetchData = async () => {
    try {
      const [invRes, planRes] = await Promise.all([
        fetch("/api/skeum/data"),
        fetch("/api/skeum/relief/request"),
      ]);
      const invData = await invRes.json();
      const planData = await planRes.json();
      if (invData.success) {
        setInvoices((invData.data?.invoices || []).filter((inv: Invoice) => inv.status !== "paid"));
      }
      if (planData.success) {
        setPlans(planData.plans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !reason) { setToast("Pilih tagihan dan jelaskan alasan pengajuan"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/skeum/relief/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: selectedInvoiceId, scheme, reason, documentUrl: documentUrl || null }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Pengajuan keringanan berhasil dikirim!");
        setSelectedInvoiceId(""); setReason(""); setDocumentUrl("");
        await fetchData();
      } else {
        setToast(data.error || "Gagal mengirim pengajuan");
      }
    } catch (err: any) { setToast(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Pengajuan Keringanan / Cicilan</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Ajukan permohonan keringanan atau cicilan untuk tagihan UKT/SPP</p>
          </div>
          <a href="/skeum" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl border border-slate-700 transition">← Kembali ke Portal</a>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><span>✍️</span> Form Pengajuan</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Pilih Tagihan</label>
              <select required value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600">
                <option value="">-- Pilih tagihan --</option>
                {invoices.map((inv) => {
                  const label = statusLabel(inv.status);
                  return (<option key={inv.id} value={inv.id}>{inv.invoiceNumber} | {inv.period} | Rp {Number(inv.totalAmount).toLocaleString("id-ID")} | {label}</option>);
                })}
              </select>
              {invoices.length === 0 && <p className="text-[10px] text-slate-500 mt-1">Tidak ada tagihan yang tersedia untuk pengajuan.</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Skema Keringanan</label>
              <select value={scheme} onChange={(e) => setScheme(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600">
                <option value="cicilan_2x">Cicilan 2x</option>
                <option value="cicilan_3x">Cicilan 3x</option>
                <option value="penundaan_1bulan">Penundaan 1 Bulan</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">{scheme === "penundaan_1bulan" ? "Jatuh tempo tagihan ditunda 1 bulan." : scheme === "cicilan_2x" ? "Total tagihan dibagi 2 angsuran bulanan." : "Total tagihan dibagi 3 angsuran bulanan."}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Alasan Pengajuan</label>
              <textarea required placeholder="Jelaskan alasan mengajukan keringanan/cicilan..." value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 h-24 resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">URL Dokumen Pendukung (opsional)</label>
              <input type="url" placeholder="https://drive.google.com/... (SKTM/PHK/dll)" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <p className="text-[10px] text-slate-500 mt-1">Unggah dokumen ke Google Drive/Dropbox dan paste link-nya di sini.</p>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <a href="/skeum" className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition">Batal</a>
              <button type="submit" disabled={submitting || invoices.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Mengirim..." : "Kirim Pengajuan"}</button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Riwayat Pengajuan Saya</h3>
          {loading ? (<div className="text-center py-6 text-slate-500 text-xs animate-pulse">Memuat data...</div>) : plans.length === 0 ? (<div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada pengajuan keringanan.</p></div>) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold"><tr><th className="pb-3 px-2">Tanggal</th><th className="pb-3 px-2">Tagihan</th><th className="pb-3 px-2">Skema</th><th className="pb-3 px-2">Alasan</th><th className="pb-3 px-2">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {plans.map((plan) => {
                    const label: Record<string, string> = { cicilan_2x: "Cicilan 2x", cicilan_3x: "Cicilan 3x", penundaan_1bulan: "Penundaan 1 Bulan" };
                    return (<tr key={plan.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-2 font-mono text-slate-400">{new Date(plan.createdAt).toLocaleDateString("id-ID")}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{plan.invoiceId.slice(0, 8)}...</td>
                      <td className="py-3 px-2">{label[plan.scheme] || plan.scheme}</td>
                      <td className="py-3 px-2 text-slate-400 max-w-[200px] truncate">{plan.reason}</td>
                      <td className="py-3 px-2"><span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${plan.status === "disetujui" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : plan.status === "ditolak" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : plan.status === "berjalan" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>{plan.status.toUpperCase()}</span></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">✨ {toast}</div>}
    </div>
  );
}
