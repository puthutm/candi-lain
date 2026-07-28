"use client";

import { useState, useEffect } from "react";
import AppSwitcher from "@/app/components/AppSwitcher";

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

  // Fase 2: Beasiswa & Keringanan
  const [_scholarshipPrograms, setScholarshipPrograms] = useState<any[]>([]);
  const [_reliefRequests, setReliefRequests] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<"all" | "outstanding" | "lunas">("all");

  // UI Control
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);

  // Clearance Check Modal State
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [clearanceNIM, setClearanceNIM] = useState("");
  const [clearanceResult, setClearanceResult] = useState<any>(null);

  const handleExportInvoicesCsv = () => {
    if (invoices.length === 0) {
      triggerNotice("Tidak ada data tagihan untuk diekspor.");
      return;
    }
    const filtered = invoices.filter(inv => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || inv.academicPeriodLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
      return matchesSearch && matchesStatus;
    });

    const headers = ["No. Invoice", "NIM / User ID", "Jenis Tagihan", "Periode", "Total Tagihan", "Terbayar", "Tunggakan", "Status", "Batas Waktu"];
    const rows = filtered.map(inv => [
      `"${inv.invoiceNumber || ""}"`,
      `"${inv.studentUserId || ""}"`,
      `"${inv.invoiceType || ""}"`,
      `"${inv.academicPeriodLabel || ""}"`,
      `"${inv.totalAmount || 0}"`,
      `"${inv.paidAmount || 0}"`,
      `"${inv.outstandingAmount || 0}"`,
      `"${inv.status || ""}"`,
      `"${inv.dueDate || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tagihan_Keuangan_SKEU_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotice(`Sukses mengunduh ${filtered.length} data tagihan ke CSV!`);
  };

  // Modals & Forms
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<TuitionRate> | null>(null);
  
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [newCoa, setNewCoa] = useState({ accountCode: "", accountName: "", accountType: "aset" });

  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);

  // Beasiswa modal
  const [_showScholarshipModal, _setShowScholarshipModal] = useState(false);
  const [_scholarshipForm, _setScholarshipForm] = useState({ code: "", name: "", fundingSource: "internal", quota: "", nominalPerSemester: "", description: "" });

  // Fase 3: Pengeluaran
  const [pengeluaranSubTab, setPengeluaranSubTab] = useState<"payroll" | "po" | "honorarium" | "referral">("payroll");
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [poList, setPoList] = useState<any[]>([]);
  const [honorariumList, setHonorariumList] = useState<any[]>([]);
  const [referralList, setReferralList] = useState<any[]>([]);

  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({ poNumber: "", vendorName: "", category: "", amount: "", dueDate: "", description: "", requiresQuotation: false, quotationCount: "0", createdBy: "" });

  const [showHonorariumModal, setShowHonorariumModal] = useState(false);
  const [honorariumForm, setHonorariumForm] = useState({ payeeName: "", payeeNpwp: "", payeeBankAccount: "", category: "honorarium_dosen", activityDescription: "", grossAmount: "", taxType: "none", approvedBy: "" });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ period: "", source: "hris", totalGross: "", totalTax: "0", totalNet: "", approvedBy: "", items: "" });

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralForm, setReferralForm] = useState({ agentName: "", agentIdSnapshot: "", period: "", totalReferrals: "", ratePerReferral: "", taxType: "none", approvedBy: "" });

  const fetchPengeluaranData = async () => {
    try {
      const [payrollRes, poRes, honorariumRes, referralRes] = await Promise.all([
        fetch("/api/skeu/expenditure/payroll"),
        fetch("/api/skeu/expenditure/purchase-orders"),
        fetch("/api/skeu/expenditure/honorariums"),
        fetch("/api/skeu/expenditure/referrals"),
      ]);
      const payrollData = await payrollRes.json();
      const poData = await poRes.json();
      const honorariumData = await honorariumRes.json();
      const referralData = await referralRes.json();
      if (payrollData.success) setPayrollRuns(payrollData.runs || []);
      if (poData.success) setPoList(poData.orders || []);
      if (honorariumData.success) setHonorariumList(honorariumData.list || []);
      if (referralData.success) setReferralList(referralData.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/expenditure/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poForm),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg("PO berhasil dibuat");
        setShowPoModal(false);
        setPoForm({ poNumber: "", vendorName: "", category: "", amount: "", dueDate: "", description: "", requiresQuotation: false, quotationCount: "0", createdBy: "" });
        fetchPengeluaranData();
      } else {
        setToastMsg(data.error || "Gagal membuat PO");
      }
    } catch (err: any) { setToastMsg(err.message); }
  };

  const handleCreateHonorarium = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/expenditure/honorariums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(honorariumForm),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg("Honorarium berhasil dicatat");
        setShowHonorariumModal(false);
        setHonorariumForm({ payeeName: "", payeeNpwp: "", payeeBankAccount: "", category: "honorarium_dosen", activityDescription: "", grossAmount: "", taxType: "none", approvedBy: "" });
        fetchPengeluaranData();
      } else {
        setToastMsg(data.error || "Gagal mencatat honorarium");
      }
    } catch (err: any) { setToastMsg(err.message); }
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = payrollForm.items ? JSON.parse(payrollForm.items) : [];
      const res = await fetch("/api/skeu/expenditure/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payrollForm, items }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg("Payroll run berhasil dicatat");
        setShowPayrollModal(false);
        setPayrollForm({ period: "", source: "hris", totalGross: "", totalTax: "0", totalNet: "", approvedBy: "", items: "" });
        fetchPengeluaranData();
      } else {
        setToastMsg(data.error || "Gagal mencatat payroll");
      }
    } catch (err: any) { setToastMsg("JSON items tidak valid"); }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/expenditure/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(referralForm),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg("Komisi referral berhasil dicatat");
        setShowReferralModal(false);
        setReferralForm({ agentName: "", agentIdSnapshot: "", period: "", totalReferrals: "", ratePerReferral: "", taxType: "none", approvedBy: "" });
        fetchPengeluaranData();
      } else {
        setToastMsg(data.error || "Gagal mencatat referral");
      }
    } catch (err: any) { setToastMsg(err.message); }
  };

  useEffect(() => {
    if (activeTab === "pengeluaran") {
      fetchPengeluaranData();
    }
  }, [activeTab]);

  const redirectToSSO = () => {
    window.location.href = "/api/auth/signin/unsia-sso";
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
    }

    // Fase 2: Fetch beasiswa & keringangan
    try {
      const [schRes, relRes] = await Promise.all([
        fetch("/api/skeu/scholarships"),
        fetch("/api/skeu/relief/approvals"),
      ]);
      const schData = await schRes.json();
      const relData = await relRes.json();
      if (schData.success) setScholarshipPrograms(schData.programs || []);
      if (relData.success) setReliefRequests(relData.plans || []);
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
    setShowClearanceModal(true);
  };

  const handlePerformClearanceCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotice(`Memeriksa kelayakan bebas tunggakan untuk ${clearanceNIM || "semua mahasiswa"}...`);
    try {
      const res = await fetch("/api/admin/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: clearanceNIM })
      });
      const data = await res.json();
      if (data.success) {
        setClearanceResult({
          status: "BEBAS_TUNGGAKAN",
          blockedCount: data.blockedCount || 0,
          checkedAt: new Date().toISOString(),
        });
        triggerNotice(`Pengecekan clearance selesai! Status: Bebas Tunggakan.`);
      } else {
        triggerNotice("Pengecekan gagal: " + data.error);
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
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {[
            { id: "beranda", label: "Beranda & Kas", icon: "📊" },
            { id: "penerimaan", label: "Penerimaan SPP", icon: "🧾" },
            { id: "beasiswa", label: "Beasiswa", icon: "🎓" },
            { id: "pengeluaran", label: "Pengeluaran", icon: "📤" },
            { id: "akuntansi", label: "Akuntansi", icon: "📖" },
            { id: "pengaturan", label: "Pengaturan", icon: "⚙️" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 translate-x-1"
                    : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-200 hover:translate-x-0.5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {/* Quick Links */}
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5">
            <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Halaman Khusus</p>
            <a href="/skeu/events" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <span>🎓</span> Event & Kegiatan
            </a>
            <a href="/skeu/pmb" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <span>📈</span> Dashboard PMB
            </a>
            <a href="/skeu/beasiswa" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition">
              <span>💳</span> Kelola Beasiswa
            </a>
          </div>
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
            <AppSwitcher />
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

        {/* QUICK ACTION SHORTCUTS TOOLBAR */}
        <div className="bg-[#0b0f19]/80 border-b border-slate-800/80 px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-slate-500 uppercase tracking-widest text-[10px]">Aksi Cepat:</span>
            <button
              onClick={handleSyncInvoices}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              🔄 Tarik & Tagih SPP (SIAKAD)
            </button>
            <button
              onClick={handleExportInvoicesCsv}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              📥 Ekspor CSV Tagihan
            </button>
            <button
              onClick={() => setActiveTab("beasiswa")}
              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              🎓 Program Beasiswa & Keringanan
            </button>
            <button
              onClick={handleRunClearanceCheck}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              ⚠️ Cek Tunggakan Mahasiswa
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gateway Kas Terbuka</span>
          </div>
        </div>

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
                    className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none w-64 focus:border-blue-600 transition"
                  />
                  <button
                    onClick={handleExportInvoicesCsv}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    📥 Ekspor CSV Tagihan
                  </button>
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
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Kelola Beasiswa & Keringanan</h3>
                <p className="text-xs text-slate-400">Gunakan halaman khusus untuk mengelola program beasiswa dan approval pengajuan keringanan.</p>
                <a href="/skeu/beasiswa" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition">
                  Buka Halaman Beasiswa →
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: PENGELUARAN */}
          {activeTab === "pengeluaran" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="flex gap-2 border-b border-slate-800">
                {[
                  { id: "payroll", label: "Payroll" },
                  { id: "po", label: "Purchase Order" },
                  { id: "honorarium", label: "Honorarium" },
                  { id: "referral", label: "Referral CRM" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPengeluaranSubTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
                      pengeluaranSubTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUBTAB: PAYROLL */}
              {pengeluaranSubTab === "payroll" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Disbursement Payroll</h3>
                    <button onClick={() => setShowPayrollModal(true)} className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg">+ Tambah Payroll</button>
                  </div>
                  {payrollRuns.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada data payroll.</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                          <tr><th className="pb-3 px-2">Periode</th><th className="pb-3 px-2">Sumber</th><th className="pb-3 px-2">Total Net</th><th className="pb-3 px-2">Status</th><th className="pb-3 px-2">Disburse</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {payrollRuns.map((run) => (
                            <tr key={run.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-2 font-bold text-white">{run.period}</td>
                              <td className="py-3 px-2 uppercase">{run.source}</td>
                              <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(run.totalNet).toLocaleString("id-ID")}</td>
                              <td className="py-3 px-2"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${run.status === "disbursed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : run.status === "disetujui" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>{run.status.toUpperCase()}</span></td>
                              <td className="py-3 px-2 font-mono text-slate-400">{run.approvedBy || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: PO */}
              {pengeluaranSubTab === "po" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Purchase Order Belanja</h3>
                    <button onClick={() => setShowPoModal(true)} className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg">+ Buat PO</button>
                  </div>
                  {poList.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada PO.</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                          <tr><th className="pb-3 px-2">Nomor PO</th><th className="pb-3 px-2">Vendor</th><th className="pb-3 px-2">Kategori</th><th className="pb-3 px-2">Nominal</th><th className="pb-3 px-2">Status</th><th className="pb-3 px-2">Tahap</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {poList.map((po) => (
                            <tr key={po.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-2 font-bold text-white">{po.poNumber}</td>
                              <td className="py-3 px-2">{po.vendorName}</td>
                              <td className="py-3 px-2">{po.category}</td>
                              <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(po.amount).toLocaleString("id-ID")}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${po.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : po.status === "paid" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                                  {po.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-2">{po.currentStage ? po.currentStage.replace("_", " ").toUpperCase() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: HONORARIUM */}
              {pengeluaranSubTab === "honorarium" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Honorarium & Insentif</h3>
                    <button onClick={() => setShowHonorariumModal(true)} className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg">+ Catat Honorarium</button>
                  </div>
                  {honorariumList.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada catatan honorarium.</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                          <tr><th className="pb-3 px-2">Penerima</th><th className="pb-3 px-2">Kategori</th><th className="pb-3 px-2">Nominal Gross</th><th className="pb-3 px-2">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {honorariumList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-2 font-bold text-white">{item.payeeName}</td>
                              <td className="py-3 px-2">{item.category}</td>
                              <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(item.grossAmount).toLocaleString("id-ID")}</td>
                              <td className="py-3 px-2"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{item.status?.toUpperCase() || "PENDING"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: REFERRAL */}
              {pengeluaranSubTab === "referral" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Komisi Referral Agent</h3>
                    <button onClick={() => setShowReferralModal(true)} className="px-3 py-1 bg-blue-600 text-white font-bold text-[9px] rounded-lg">+ Catat Referral</button>
                  </div>
                  {referralList.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada komisi referral.</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                          <tr><th className="pb-3 px-2">Agent</th><th className="pb-3 px-2">Periode</th><th className="pb-3 px-2">Jumlah</th><th className="pb-3 px-2">Rate/Mhs</th><th className="pb-3 px-2">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {referralList.map((ref) => (
                            <tr key={ref.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-2 font-bold text-white">{ref.agentName}</td>
                              <td className="py-3 px-2">{ref.period}</td>
                              <td className="py-3 px-2 font-mono">{ref.totalReferrals}</td>
                              <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(ref.ratePerReferral).toLocaleString("id-ID")}</td>
                              <td className="py-3 px-2"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">{ref.status?.toUpperCase() || "PENDING"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
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

      {/* MODAL: CREATE PO */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePo} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Buat Purchase Order (PO)</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nomor PO</label>
              <input type="text" required value={poForm.poNumber} onChange={(e) => setPoForm({...poForm, poNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Vendor</label>
              <input type="text" required value={poForm.vendorName} onChange={(e) => setPoForm({...poForm, vendorName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Kategori</label>
              <input type="text" required value={poForm.category} onChange={(e) => setPoForm({...poForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nominal (Rp)</label>
              <input type="number" required value={poForm.amount} onChange={(e) => setPoForm({...poForm, amount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowPoModal(false)} className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl">Batal</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE HONORARIUM */}
      {showHonorariumModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateHonorarium} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Catat Honorarium</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nama Penerima</label>
              <input type="text" required value={honorariumForm.payeeName} onChange={(e) => setHonorariumForm({...honorariumForm, payeeName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Kategori</label>
              <select value={honorariumForm.category} onChange={(e) => setHonorariumForm({...honorariumForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600">
                <option value="honorarium_dosen">Honorarium Dosen</option>
                <option value="honorarium_narasumber">Honorarium Narasumber</option>
                <option value="insentif_panitia">Insentif Panitia</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nominal Gross (Rp)</label>
              <input type="number" required value={honorariumForm.grossAmount} onChange={(e) => setHonorariumForm({...honorariumForm, grossAmount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowHonorariumModal(false)} className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl">Batal</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE PAYROLL */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePayroll} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Catat Payroll</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Periode (misal: 2026-07)</label>
              <input type="text" required value={payrollForm.period} onChange={(e) => setPayrollForm({...payrollForm, period: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Total Net (Rp)</label>
              <input type="number" required value={payrollForm.totalNet} onChange={(e) => setPayrollForm({...payrollForm, totalNet: e.target.value, totalGross: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowPayrollModal(false)} className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl">Batal</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE REFERRAL */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateReferral} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Catat Komisi Referral</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Nama Agent</label>
              <input type="text" required value={referralForm.agentName} onChange={(e) => setReferralForm({...referralForm, agentName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Periode</label>
              <input type="text" required value={referralForm.period} onChange={(e) => setReferralForm({...referralForm, period: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Total Referral</label>
                <input type="number" required value={referralForm.totalReferrals} onChange={(e) => setReferralForm({...referralForm, totalReferrals: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">Rate Per Mahasiswa (Rp)</label>
                <input type="number" required value={referralForm.ratePerReferral} onChange={(e) => setReferralForm({...referralForm, ratePerReferral: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowReferralModal(false)} className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl">Batal</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CLEARANCE CHECK BEBAS TUNGGAKAN */}
      {showClearanceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Cek Bebas Tunggakan (Clearance)</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Pemeriksaan status kelayakan wisuda & sidang skripsi</p>
              </div>
              <button onClick={() => setShowClearanceModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handlePerformClearanceCheck} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase">NIM Mahasiswa (Opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk cek seluruh mahasiswa"
                  value={clearanceNIM}
                  onChange={(e) => setClearanceNIM(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 font-mono"
                />
              </div>

              {clearanceResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Status Pengecekan</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-black uppercase text-[10px]">
                      {clearanceResult.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Mahasiswa Tertangguh</span>
                    <span className="font-bold text-rose-400 font-mono">{clearanceResult.blockedCount} Orang</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">Sistem otomatis menerbitkan sertifikat bebas tunggakan bagi mahasiswa lunas.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowClearanceModal(false);
                    setClearanceResult(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  ⚡ Jalankan Clearance Check
                </button>
              </div>
            </form>
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
