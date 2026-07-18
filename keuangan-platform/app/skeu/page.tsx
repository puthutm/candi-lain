"use client";

import React, { useState, useEffect } from "react";
import { SSO_AUTHORIZE_URL, SSO_CLIENT_ID, SSO_CALLBACK_URL } from "@/lib/client-config";

interface TuitionRate {
  id: string;
  studyProgramRef: string;
  studyProgramNameSnapshot: string;
  academicPeriodLabel: string;
  sppAmount: string;
  bopAmount: string;
  totalAmount: string;
  requiresYayasanApproval: boolean;
}

interface CoaAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface StudentInvoice {
  id: string;
  studentUserId: string;
  invoiceNumber: string;
  invoiceType: string;
  academicPeriodLabel: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: string;
  dueDate: string;
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

export default function SkeuDashboard() {
  const [activeTab, setActiveTab] = useState<
    "beranda" | "penerimaan" | "beasiswa" | "pengeluaran" | "akuntansi" | "pengaturan"
  >("beranda");

  // Core Data
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [coa, setCoa] = useState<CoaAccount[]>([]);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<"all" | "outstanding" | "lunas">("all");

  // UI Control
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);

  // Modals & Forms
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<TuitionRate> | null>(null);
  
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [newCoa, setNewCoa] = useState({ accountCode: "", accountName: "", accountType: "aset" });

  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);

  const redirectToSSO = () => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    document.cookie = `sso_code_verifier=${verifier}; path=/; max-age=600; SameSite=Lax`;

    let authUrl = SSO_AUTHORIZE_URL;
    let cbUrl = SSO_CALLBACK_URL;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1" && authUrl.includes("localhost")) {
        authUrl = authUrl.replace("localhost", host);
      }
      const currentHost = window.location.host;
      if (!cbUrl.includes(currentHost) && cbUrl.includes("localhost")) {
        cbUrl = cbUrl.replace("localhost:3005", currentHost);
      }
    }
    window.location.href = `${authUrl}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(cbUrl)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.authenticated && data.user && data.user.role !== "mahasiswa") {
        setAdminUser(data.user);
        setCheckingAuth(false);
        await fetchData();
      } else {
        redirectToSSO();
      }
    } catch (err) {
      redirectToSSO();
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/skeu/data");
      const data = await res.json();
      if (data.success) {
        setRates(data.rates || []);
        setCoa(data.coa || []);
        setInvoices(data.invoices || []);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const triggerNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleSyncInvoices = async () => {
    triggerNotice("Menginisiasi sinkronisasi & penerbitan tagihan dari SIAKAD...");
    try {
      const res = await fetch("/api/sync/siakad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicPeriodLabel: "2026/2027 Ganjil" })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Tagihan akademik mahasiswa berhasil disinkronkan!");
        fetchData();
      } else {
        triggerNotice("Gagal sinkronisasi: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat jaringan: " + err.message);
    }
  };

  const handleRunClearanceCheck = async () => {
    triggerNotice("Menjalankan pengecekan clearance tunggakan SPP jatuh tempo...");
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(`Penalti clearance berhasil diproses! ${data.blockedCount} mahasiswa tertangguhkan.`);
        fetchData();
      } else {
        triggerNotice("Gagal clearance: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat jaringan: " + err.message);
    }
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    try {
      const method = editingRate.id ? "PUT" : "POST";
      const res = await fetch("/api/skeu/tuition-rates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRate)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Item tarif UKT berhasil disimpan!");
        setShowRateModal(false);
        fetchData();
      } else {
        triggerNotice("Gagal menyimpan tarif: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat: " + err.message);
    }
  };

  const handleSaveCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoa)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Akun COA baru berhasil didaftarkan!");
        setShowCoaModal(false);
        fetchData();
      } else {
        triggerNotice("Gagal menyimpan COA: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat: " + err.message);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await fetch("/api/skeu/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });
        const data = await res.json();
        if (data.success) {
          triggerNotice(`Sukses mengimpor ${data.count} matriks tarif UKT baru!`);
          fetchData();
        } else {
          triggerNotice("Gagal impor: " + data.error);
        }
      } catch (err: any) {
        triggerNotice("Galat impor: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    document.cookie = "keuangan_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/login";
  };

  // Metrics
  const totalSPPReceived = payments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + parseFloat(curr.outstandingAmount), 0);
  const totalBilled = invoices.reduce((acc, curr) => acc + parseFloat(curr.totalAmount), 0);
  const collectionRate = totalBilled > 0 ? ((totalSPPReceived / totalBilled) * 100).toFixed(1) : "0.0";

  // Filter lists
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || inv.academicPeriodLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRates = rates.filter(r => r.studyProgramNameSnapshot.toLowerCase().includes(searchQuery.toLowerCase()));

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {checkingAuth ? "Validasi Sesi SSO..." : "Memuat Portal SKEU..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0b0f19] border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">SKEU Portal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universitas Siber Asia</p>
          </div>
        </div>

        {/* User Badge */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/35 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
            {adminUser?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-xs text-slate-200 truncate">{adminUser?.name}</p>
            <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase">{adminUser?.role?.replace("_", " ")}</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: "beranda", label: "Beranda & Kas", icon: "📊" },
            { id: "penerimaan", label: "Penerimaan SPP", icon: "🧾" },
            { id: "beasiswa", label: "Beasiswa", icon: "🎓" },
            { id: "pengeluaran", label: "Pengeluaran", icon: "📤" },
            { id: "akuntansi", label: "Akuntansi", icon: "📖" },
            { id: "pengaturan", label: "Pengaturan", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 transition"
          >
            🚪 Keluar Portal
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 bg-[#0f172a]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <h2 className="font-extrabold text-sm text-white uppercase tracking-wider">
                {activeTab === "beranda" ? "Treasury & Manajemen Kas" :
                 activeTab === "penerimaan" ? "Administrasi Penerimaan SPP/UKT" :
                 activeTab === "beasiswa" ? "Netting Beasiswa & Keringanan" :
                 activeTab === "pengeluaran" ? "Pengeluaran Belanja & PO" :
                 activeTab === "akuntansi" ? "Jurnal & CoA Akuntansi" :
                 "Pengaturan Integrasi"}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold">Portal Administrasi Keuangan Terpusat</p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncInvoices}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              🔄 Tarik & Tagih SPP
            </button>
            <button
              onClick={handleRunClearanceCheck}
              className="px-3.5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              ⚠️ Cek Tunggakan
            </button>
          </div>
        </header>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TAB 1: BERANDA & KAS */}
          {activeTab === "beranda" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pendapatan SPP (YTD)</span>
                  <div className="mt-2 text-lg font-black text-emerald-400 font-mono">Rp {totalSPPReceived.toLocaleString("id-ID")}</div>
                  <span className="text-[9px] text-slate-400 mt-2 block">100% terekonsiliasi otomatis</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Piutang Outstanding</span>
                  <div className="mt-2 text-lg font-black text-rose-400 font-mono">Rp {totalOutstanding.toLocaleString("id-ID")}</div>
                  <span className="text-[9px] text-slate-400 mt-2 block">Tunggakan aktif semester ganjil</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Collection Rate</span>
                  <div className="mt-2 text-lg font-black text-blue-400 font-mono">{collectionRate}%</div>
                  <span className="text-[9px] text-slate-400 mt-2 block">Rasio tagihan terbayar</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo Bank Konsolidasi</span>
                  <div className="mt-2 text-lg font-black text-[#FED524] font-mono">Rp {(totalSPPReceived + 125000000).toLocaleString("id-ID")}</div>
                  <span className="text-[9px] text-slate-400 mt-2 block">Rekening BCA & Mandiri</span>
                </div>
              </div>

              {/* Cash flow list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4">Mutasi Kas & Transaksi Masuk PG</h3>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((pay) => (
                      <div key={pay.id} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-500 text-lg">📥</span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{pay.providerRef}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{pay.channel?.replace("_", " ").toUpperCase()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-400 font-mono">+Rp {Number(pay.amount).toLocaleString("id-ID")}</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">{pay.paidAt ? new Date(pay.paidAt).toLocaleDateString("id-ID") : "-"}</div>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && (
                      <p className="text-center py-6 text-slate-500 text-xs">Belum ada riwayat transaksi masuk.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-4">Kas & Rekening Operasional</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">BCA Penerimaan SPP</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">8002-1200-55</div>
                      </div>
                      <div className="text-right font-bold text-sm text-slate-300 font-mono">
                        Rp {(totalSPPReceived * 0.7).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">Mandiri Operasional</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">157-00-11882</div>
                      </div>
                      <div className="text-right font-bold text-sm text-slate-300 font-mono">
                        Rp {(totalSPPReceived * 0.3 + 125000000).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENERIMAAN SPP */}
          {activeTab === "penerimaan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInvoiceFilterStatus("all")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      invoiceFilterStatus === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    onClick={() => setInvoiceFilterStatus("outstanding")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      invoiceFilterStatus === "outstanding" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Belum Lunas
                  </button>
                  <button
                    onClick={() => setInvoiceFilterStatus("lunas")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      invoiceFilterStatus === "lunas" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Lunas
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari invoice atau mahasiswa..."
                    className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none w-64"
                  />
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-6 py-4">No. Invoice & Periode</th>
                        <th className="px-6 py-4">Total Billed</th>
                        <th className="px-6 py-4 text-right">Terbayar</th>
                        <th className="px-6 py-4 text-right">Outstanding</th>
                        <th className="px-6 py-4 text-center">Jatuh Tempo</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-850/30 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-200 font-mono">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{inv.academicPeriodLabel}</div>
                          </td>
                          <td className="px-6 py-4 font-bold font-mono text-slate-300">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">Rp {Number(inv.paidAmount).toLocaleString("id-ID")}</td>
                          <td className="px-6 py-4 text-right font-mono text-slate-400">Rp {Number(inv.outstandingAmount).toLocaleString("id-ID")}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{inv.dueDate}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                              inv.status === "lunas" ? "bg-emerald-500/20 text-emerald-400" :
                              inv.status === "outstanding" ? "bg-yellow-500/20 text-yellow-400 animate-pulse" :
                              "bg-slate-800 text-slate-500"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-bold text-[9px] transition"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredInvoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">Tidak ada tagihan pembayaran terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BEASISWA */}
          {activeTab === "beasiswa" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Daftar Pengajuan Keringanan & KIP-K</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Muhammad Iqbal (NIM: 20260401)</div>
                      <p className="text-[10px] text-slate-400 mt-1">Mengajukan Cicilan SPP Ganjil 2x - Alasan: Pemutusan Hubungan Kerja Orang Tua</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded">Setujui</button>
                      <button className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-bold rounded">Tolak</button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Fitri Hapsari (NIM: 20260588)</div>
                      <p className="text-[10px] text-slate-400 mt-1">Netting KIP-Kuliah Kemendikbud - Beasiswa Penuh Semester Ganjil</p>
                    </div>
                    <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-black uppercase">Otomatis Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENGELUARAN */}
          {activeTab === "pengeluaran" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Disbursement Payroll Karyawan (Dari HRIS)</h3>
                <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Payroll Periode Mei 2026</div>
                    <p className="text-[10px] text-slate-500 mt-1">Jumlah: 8 Karyawan · Total Net: Rp 45.334.800</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-1 rounded bg-emerald-500/25 text-emerald-400 border border-emerald-500/20">
                    Disbursed & Slip Terbit
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Daftar Purchase Order Belanja (PO)</h3>
                  <button className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg">➕ Buat PO</button>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-slate-200">PO-2026-001: Pengadaan Router Ruang Server</div>
                      <p className="text-[10px] text-slate-500 mt-1">Vendor: Cisco System · Nominal: Rp 12.500.000</p>
                    </div>
                    <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase">Approved</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AKUNTANSI */}
          {activeTab === "akuntansi" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Chart of Accounts (COA)</h3>
                  <button
                    onClick={() => {
                      setNewCoa({ accountCode: "", accountName: "", accountType: "aset" });
                      setShowCoaModal(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg"
                  >
                    ➕ Tambah Akun
                  </button>
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
                      {coa.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-3 font-mono text-[#FED524]">{c.accountCode}</td>
                          <td className="py-3 font-semibold text-slate-300">{c.accountName}</td>
                          <td className="py-3">
                            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">
                              {c.accountType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PENGATURAN */}
          {activeTab === "pengaturan" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl animate-fade-in space-y-6">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-3">Pengaturan Tarif SPP/UKT & Impor Matriks</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-slate-850">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Import Tarif SPP (CSV)</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Unggah berkas CSV berisi nama prodi, SPP, dan BOP per periode.</p>
                  </div>
                  <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl transition cursor-pointer text-center text-white">
                    📥 Upload CSV
                    <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Tuition rates matrix grid */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400">Matriks Tarif Per Program Studi</h4>
                  <button
                    onClick={() => {
                      setEditingRate({
                        studyProgramRef: "00000000-0000-0000-0000-000000000000",
                        studyProgramNameSnapshot: "",
                        academicPeriodLabel: "2026/2027 Ganjil",
                        sppAmount: "6000000",
                        bopAmount: "2500000",
                        requiresYayasanApproval: false
                      });
                      setShowRateModal(true);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-[9px] text-slate-300 font-bold rounded"
                  >
                    ➕ Tambah Tarif
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredRates.map(rate => (
                    <div key={rate.id} className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{rate.studyProgramNameSnapshot}</div>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{rate.academicPeriodLabel} · SPP: Rp {Number(rate.sppAmount).toLocaleString("id-ID")} · BOP: Rp {Number(rate.bopAmount).toLocaleString("id-ID")}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingRate(rate);
                          setShowRateModal(true);
                        }}
                        className="px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-white text-[9px] rounded"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: ADD / EDIT TUITION RATE */}
      {showRateModal && editingRate && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveRate} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              {editingRate.id ? "Edit Tarif Prodi" : "Tambah Tarif Prodi"}
            </h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nama Program Studi</label>
              <input
                type="text"
                required
                value={editingRate.studyProgramNameSnapshot || ""}
                onChange={(e) => setEditingRate({ ...editingRate, studyProgramNameSnapshot: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">SPP Per Semester</label>
                <input
                  type="number"
                  required
                  value={editingRate.sppAmount || ""}
                  onChange={(e) => setEditingRate({ ...editingRate, sppAmount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">BOP</label>
                <input
                  type="number"
                  required
                  value={editingRate.bopAmount || ""}
                  onChange={(e) => setEditingRate({ ...editingRate, bopAmount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Periode Akademik</label>
              <input
                type="text"
                required
                value={editingRate.academicPeriodLabel || "2026/2027 Ganjil"}
                onChange={(e) => setEditingRate({ ...editingRate, academicPeriodLabel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD COA ACCOUNT */}
      {showCoaModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveCoa} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Tambah Akun COA</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Kode Akun</label>
              <input
                type="text"
                required
                value={newCoa.accountCode}
                onChange={(e) => setNewCoa({ ...newCoa, accountCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nama Akun</label>
              <input
                type="text"
                required
                value={newCoa.accountName}
                onChange={(e) => setNewCoa({ ...newCoa, accountName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Tipe Akun</label>
              <select
                value={newCoa.accountType}
                onChange={(e) => setNewCoa({ ...newCoa, accountType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              >
                <option value="aset">Aset</option>
                <option value="liabilitas">Liabilitas</option>
                <option value="ekuitas">Ekuitas</option>
                <option value="pendapatan">Pendapatan</option>
                <option value="beban">Beban</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCoaModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: INVOICE DETAILS */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-mono font-bold text-white text-base">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{selectedInvoice.academicPeriodLabel}</p>
              </div>
              <span className={`text-[8px] font-black px-2.5 py-0.5 rounded uppercase ${
                selectedInvoice.status === "lunas" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {selectedInvoice.status}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Jatuh Tempo:</span>
                <span className="font-bold text-slate-300">{selectedInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Tagihan:</span>
                <span className="font-bold text-slate-300 font-mono">Rp {Number(selectedInvoice.totalAmount).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Sudah Terbayar:</span>
                <span className="font-bold text-emerald-400 font-mono">Rp {Number(selectedInvoice.paidAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span>✨</span> {toastMsg}
        </div>
      )}

    </div>
  );
}
