"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  academicPeriodLabel: string;
  dueDate: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: string;
}

interface PaymentLog {
  id: string;
  invoiceId: string;
  channel: string;
  providerRef: string;
  amount: string;
  status: string;
  paidAt: string;
}

interface Clearance {
  status: "aktif" | "tertahan";
  reason: string | null;
}

export default function SkeumDashboard() {
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [clearance, setClearance] = useState<Clearance>({ status: "aktif", reason: null });
  const [studentUser, setStudentUser] = useState<{ name: string; username: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Keringanan Form State
  const [showKeringananModal, setShowKeringananModal] = useState(false);
  const [keringananForm, setKeringananForm] = useState({ skema: "cicilan_2x", alasan: "" });

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => {
      setNotice(null);
    }, 4500);
  };

  const fetchStudentData = async () => {
    try {
      // 1. Fetch session info
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok || !sessionData.success || !sessionData.authenticated) {
        router.push("/login");
        return;
      }
      setStudentUser(sessionData.user);

      // 2. Fetch SKEUM data
      const dataRes = await fetch("/api/skeum/data");
      const data = await dataRes.json();
      
      if (data.success) {
        setInvoices(data.invoices || []);
        setPayments(data.payments || []);
        setClearance(data.clearance || { status: "aktif", reason: null });
      } else {
        triggerNotice(data.error || "Gagal memuat data tagihan", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan koneksi: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [router]);

  const handlePay = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    triggerNotice("Memproses pembayaran simulasi Virtual Account...");
    try {
      const res = await fetch("/api/skeum/simulate-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, channel: "virtual_account" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Simulasi pembayaran lunas! Status keaktifan SIAKAD sinkron.");
        fetchStudentData();
      } else {
        triggerNotice(data.error || "Pembayaran gagal", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    document.cookie = "keuangan_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const handleKeringananSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotice("Permohonan cicilan keringanan berhasil diajukan ke biro keuangan!");
    setShowKeringananModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Portal SKEUM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8 font-sans">
      
      {/* Toast Notice */}
      {notice && (
        <div className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
          isError 
            ? "bg-rose-950/90 border-rose-800 text-rose-200" 
            : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{isError ? "⚠️" : "✨"}</span>
            <p className="text-xs font-bold tracking-wide">{notice}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FED524] to-[#c29c0f] flex items-center justify-center shadow-lg">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-white">SKEUM Mahasiswa</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universitas Siber Asia · Portal Pembayaran UKT</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{studentUser?.name}</div>
            <div className="text-[9px] text-[#FED524] font-mono">{studentUser?.username}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-xs font-bold rounded-xl transition duration-150"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* CLEARANCE WARNING BANNER */}
        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
          clearance.status === "aktif" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
        }`}>
          <span className="text-2xl">{clearance.status === "aktif" ? "✅" : "🚨"}</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">
              Status Clearance: {clearance.status === "aktif" ? "Aktif (Bebas Keuangan)" : "Tertahan (Terblokir Finansial)"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {clearance.status === "aktif" 
                ? "Pembayaran Anda tertib. Akses pengisian KRS SIAKAD dan LMS terbuka penuh."
                : `Akses KRS SIAKAD terkunci. Alasan: ${clearance.reason || "Tunggakan jatuh tempo terdeteksi."}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: ACTIVE BILLING INVOICES */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">Daftar Tagihan Kuliah</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Daftar kewajiban pembayaran SPP/UKT aktif</p>
              </div>
              <button
                onClick={() => setShowKeringananModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[9px] font-bold rounded-lg transition"
              >
                📝 Ajukan Keringanan
              </button>
            </div>

            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold font-mono uppercase">{inv.invoiceNumber}</div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">Tagihan Semester {inv.academicPeriodLabel}</h4>
                      <p className="text-[9px] text-slate-500 mt-1">Jatuh Tempo: {inv.dueDate}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2.5 py-0.5 rounded uppercase ${
                      inv.status === "lunas" ? "bg-emerald-500/20 text-emerald-400" :
                      inv.status === "outstanding" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-slate-850 text-slate-500"
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Sisa Tagihan</span>
                      <span className="text-sm font-black text-[#FED524] font-mono">Rp {Number(inv.outstandingAmount).toLocaleString("id-ID")}</span>
                    </div>

                    {inv.status !== "lunas" && (
                      <button
                        onClick={() => handlePay(inv.id)}
                        disabled={processingId === inv.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-xl shadow-lg transition"
                      >
                        {processingId === inv.id ? "Memproses..." : "Bayar (Simulasi)"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-xs">Tidak ada tagihan pembayaran terdaftar.</p>
              )}
            </div>
          </div>

          {/* RIGHT: TRANSACTION HISTORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">Riwayat Pembayaran</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Kuitansi dan bukti bayar terdaftar</p>
            </div>

            <div className="space-y-3">
              {payments.map((pay) => (
                <div key={pay.id} className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-300">{pay.providerRef}</div>
                    <div className="text-[8px] text-slate-500 mt-1 uppercase font-black">{pay.channel?.replace("_", " ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">Rp {Number(pay.amount).toLocaleString("id-ID")}</div>
                    <span className="text-[8px] text-slate-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-black uppercase mt-1 inline-block">Success</span>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-center py-6 text-slate-500 text-xs">Belum ada riwayat transaksi masuk.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: AJUKAN KERINGANAN / CICILAN */}
      {showKeringananModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleKeringananSubmit} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Pengajuan Keringanan SPP</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Skema Keringanan</label>
              <select
                value={keringananForm.skema}
                onChange={(e) => setKeringananForm({ ...keringananForm, skema: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              >
                <option value="cicilan_2x">Cicilan 2 Kali</option>
                <option value="cicilan_3x">Cicilan 3 Kali</option>
                <option value="penundaan">Penundaan 1 Bulan</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Alasan Keringanan</label>
              <textarea
                required
                rows={3}
                value={keringananForm.alasan}
                onChange={(e) => setKeringananForm({ ...keringananForm, alasan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowKeringananModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Kirim
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
