"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface TuitionRate {
  id: string;
  studyProgramNameSnapshot: string;
  sppAmount: string;
  bopAmount: string;
}

interface CoaAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface StudentInvoice {
  id: string;
  invoiceNumber: string;
  academicPeriodLabel: string;
  totalAmount: string;
  status: string;
}

export default function SkeuDashboard() {
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [coa, setCoa] = useState<CoaAccount[]>([]);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/skeu/data");
      const data = await res.json();
      if (data.success) {
        setRates(data.rates || []);
        setCoa(data.coa || []);
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleSyncInvoice = async () => {
    triggerNotice("Memulai sinkronisasi tagihan baru...");
    try {
      const res = await fetch("/api/sync/siakad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicPeriodLabel: "2026/2027 Ganjil" })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Sinkronisasi sukses! Tagihan UKT diperbarui.");
        fetchData();
      } else {
        triggerNotice("Sinkronisasi gagal: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat jaringan: " + err.message);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        triggerNotice("CSV kosong atau format salah!");
        return;
      }
      triggerNotice(`Memproses import ${lines.length - 1} data tarif dari CSV...`);
      try {
        const res = await fetch("/api/skeu/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });
        const data = await res.json();
        if (data.success) {
          triggerNotice(`Sukses mengimpor ${data.count} data tarif baru ke database!`);
          fetchData();
        } else {
          triggerNotice("Gagal mengimpor: " + data.error);
        }
      } catch (err: any) {
        triggerNotice("Galat jaringan: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Filters based on search query
  const filteredRates = rates.filter(r => 
    r.studyProgramNameSnapshot.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoa = coa.filter(c => 
    c.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.accountCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Data SKEU...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Biro Keuangan (SKEU)</h1>
            <p className="text-xs text-slate-400 font-medium">Manajemen Data Referensi Tarif, Akuntansi, & Penagihan</p>
          </div>
        </div>

        {/* Global Search & Sync Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Cari prodi, kode akun, invoice..."
            className="px-4 py-2 bg-slate-900 border border-slate-800 focus:border-[#004996] rounded-xl text-xs font-semibold text-slate-200 outline-none w-60 transition"
          />
          <button 
            onClick={handleSyncInvoice}
            className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#004996]/15 transition"
          >
            🔄 Sync Tagihan
          </button>
          <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center">
            📥 Import Tarif (CSV)
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />
          </label>
          <Link href="/login" className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition">
            Keluar
          </Link>
        </div>
      </header>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABEL 1: TARIF UKT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>💳</span> Tarif UKT Per Prodi
            </h2>
            <span className="text-[10px] bg-[#004996]/20 text-[#3b82f6] px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredRates.length} Item
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">Program Studi</th>
                  <th className="pb-3 text-right">SPP (Sem)</th>
                  <th className="pb-3 text-right">BOP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-semibold text-slate-300">{rate.studyProgramNameSnapshot}</td>
                    <td className="py-3 text-right text-[#FED524] font-bold">Rp {Number(rate.sppAmount).toLocaleString("id-ID")}</td>
                    <td className="py-3 text-right text-slate-300">Rp {Number(rate.bopAmount).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
                {filteredRates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada tarif yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 2: CHART OF ACCOUNTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>📖</span> Chart of Accounts (COA)
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredCoa.length} Akun
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Nama Akun</th>
                  <th className="pb-3">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredCoa.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-xs text-[#FED524]">{c.accountCode}</td>
                    <td className="py-3 font-semibold text-slate-300">{c.accountName}</td>
                    <td className="py-3">
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">
                        {c.accountType}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCoa.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada akun yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 3: BATCH INVOICES LOG */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🧾</span> Log Tagihan Mahasiswa
            </h2>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredInvoices.length} Item
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">No. Invoice</th>
                  <th className="pb-3 text-right">Nominal</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-slate-300">{inv.invoiceNumber}</td>
                    <td className="py-3 text-right font-bold text-slate-300">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</td>
                    <td className="py-3 text-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                        inv.status === "lunas" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada tagihan yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* TOAST NOTICE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span>✨</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
