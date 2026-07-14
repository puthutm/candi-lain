"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function SkeumDashboard() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => {
      setNotice(null);
    }, 5000);
  };

  const fetchInvoices = async () => {
    try {
      // Fetch session info
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok || !sessionData.success || !sessionData.authenticated) {
        router.push("/login");
        return;
      }

      // Fetch all invoices (the endpoint returns rates, coa, and invoices)
      const dataRes = await fetch("/api/skeu/data");
      const data = await dataRes.json();
      
      if (data.success) {
        // Filter invoices for the logged in student
        const studentUserId = sessionData.user.userId;
        const studentInvoicesList = (data.invoices || []).filter(
          (inv: any) => inv.studentUserId === studentUserId
        );
        setInvoices(studentInvoicesList);
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
    fetchInvoices();
  }, [router]);

  const handlePay = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    triggerNotice("Memproses pembayaran...");
    try {
      const res = await fetch("/api/skeum/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Simulasi pembayaran berhasil!");
        fetchInvoices();
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Toast Notice */}
      {notice && (
        <div className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
          isError 
            ? "bg-rose-950/90 border-rose-800 text-rose-200" 
            : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{isError ? "⚠️" : "💡"}</span>
            <p className="text-xs font-bold tracking-wide">{notice}</p>
          </div>
        </div>
      )}

      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FED524] to-[#c29c0f] flex items-center justify-center shadow-lg">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Portal Keuangan Mahasiswa (SKEUM)</h1>
            <p className="text-xs text-slate-400 font-medium">Informasi Tagihan & Riwayat Pembayaran Kuliah</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Daftar Tagihan Aktif</h2>
              <p className="text-xs text-slate-400">Bayar UKT/Pembayaran Kuliah Anda di bawah ini</p>
            </div>
            <span className="text-xs font-bold bg-[#FED524]/20 text-[#FED524] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Metode Virtual Account
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-850/20 px-4 rounded-xl transition">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{inv.invoiceNumber}</span>
                    <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{inv.invoiceType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Tagihan Semester ({inv.academicPeriodLabel})</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Batas Waktu: {inv.dueDate}</p>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-semibold block">Sisa Tagihan</span>
                    <span className="text-sm font-black text-[#FED524]">Rp {Number(inv.outstandingAmount).toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase ${
                      inv.status === "lunas" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {inv.status}
                    </span>
                    {inv.status !== "lunas" && (
                      <button 
                        onClick={() => handlePay(inv.id)}
                        disabled={processingId === inv.id}
                        className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/90 disabled:bg-slate-800 text-white font-bold text-[10px] rounded-xl transition shadow-md shadow-[#004996]/20"
                      >
                        {processingId === inv.id ? "Memproses..." : "Bayar Sekarang"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-8 text-center text-slate-500 font-medium">
                Belum ada tagihan terdaftar untuk akun Anda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
