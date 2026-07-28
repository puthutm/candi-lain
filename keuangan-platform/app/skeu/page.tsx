"use client";

import { useState, useEffect } from "react";
import SkeuSidebar, { SkeuTabType } from "./components/SkeuSidebar";
import SkeuHeader from "./components/SkeuHeader";
import SkeuModals from "./components/SkeuModals";

// Tab Components
import BerandaTab from "./components/tabs/BerandaTab";
import PenerimaanTab from "./components/tabs/PenerimaanTab";
import PmbFeesTab from "./components/tabs/PmbFeesTab";
import BeasiswaTab from "./components/tabs/BeasiswaTab";
import PengeluaranTab from "./components/tabs/PengeluaranTab";
import AkuntansiTab from "./components/tabs/AkuntansiTab";
import PengaturanTab from "./components/tabs/PengaturanTab";

export interface TuitionRate {
  id: string;
  studyProgramRef: string;
  studyProgramNameSnapshot: string;
  academicPeriodLabel: string;
  sppAmount: string;
  bopAmount: string;
  totalAmount: string;
  requiresYayasanApproval: boolean;
}

export interface CoaAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

export interface StudentInvoice {
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

export interface PaymentLog {
  id: string;
  invoiceId: string;
  channel: string;
  providerRef: string;
  amount: string;
  status: string;
  paidAt: string;
}

export interface PmbFeeRate {
  id: string;
  waveLabel: string;
  registrationFee: string;
  examFee: string;
  reregistrationFee: string;
  matriculationFee: string;
}

export default function SkeuDashboard() {
  const [activeTab, setActiveTab] = useState<SkeuTabType>("beranda");

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

  // Clearance Check Modal State
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [clearanceNIM, setClearanceNIM] = useState("");
  const [clearanceResult, setClearanceResult] = useState<any>(null);

  // PMB Fee Rates State
  const [pmbFeeRates, setPmbFeeRates] = useState<PmbFeeRate[]>([]);
  const [showPmbFeeModal, setShowPmbFeeModal] = useState(false);
  const [editingPmbFee, setEditingPmbFee] = useState<PmbFeeRate | null>(null);
  const [pmbFeeForm, setPmbFeeForm] = useState({
    waveLabel: "",
    registrationFee: "",
    examFee: "",
    reregistrationFee: "",
    matriculationFee: "",
  });
  const [savingPmbFee, setSavingPmbFee] = useState(false);

  const triggerNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const redirectToSSO = () => {
    window.location.href = "/api/auth/signin/unsia-sso";
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        const allowedRoles = ["admin", "superadmin", "super_admin", "staff_keuangan", "pegawai"];
        if (data.success && data.authenticated && data.user && allowedRoles.includes(data.user.role)) {
          setAdminUser(data.user);
          setCheckingAuth(false);
          fetchOverview();
          fetchPmbFeeRates();
        } else {
          redirectToSSO();
        }
      } catch (err) {
        redirectToSSO();
      }
    };
    checkSession();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/keuangan-overview");
      const data = await res.json();
      if (data.success && data.data) {
        setRates(data.data.rates || []);
        setCoa(data.data.coa || []);
        setInvoices(data.data.invoices || []);
        setPayments(data.data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPmbFeeRates = async () => {
    try {
      const res = await fetch("/api/admin/pmb-fees");
      const data = await res.json();
      if (data.success) setPmbFeeRates(data.rates || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePmbFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPmbFee(true);
    try {
      const payload = editingPmbFee ? { id: editingPmbFee.id, ...pmbFeeForm } : pmbFeeForm;
      const method = editingPmbFee ? "PATCH" : "POST";
      const res = await fetch("/api/admin/pmb-fees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(editingPmbFee ? "Tarif PMB berhasil diperbarui!" : "Tarif PMB baru disimpan!");
        setShowPmbFeeModal(false);
        fetchPmbFeeRates();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerNotice(err.message);
    } finally {
      setSavingPmbFee(false);
    }
  };

  const handleCheckClearance = async () => {
    if (!clearanceNIM) {
      triggerNotice("Masukkan NIM mahasiswa terlebih dahulu.");
      return;
    }
    try {
      const res = await fetch(`/api/check-billing?nim=${clearanceNIM}`);
      const data = await res.json();
      setClearanceResult(data);
    } catch (err: any) {
      triggerNotice("Gagal mengecek clearance: " + err.message);
    }
  };

  const handleExportInvoicesCsv = () => {
    if (invoices.length === 0) {
      triggerNotice("Tidak ada data tagihan untuk diekspor.");
      return;
    }
    const filtered = invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.academicPeriodLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
      return matchesSearch && matchesStatus;
    });

    const headers = ["No. Invoice", "NIM / User ID", "Jenis Tagihan", "Periode", "Total Tagihan", "Terbayar", "Tunggakan", "Status", "Batas Waktu"];
    const rows = filtered.map((inv) => [
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

  const totalRevenue = invoices
    .filter((inv) => inv.status === "lunas")
    .reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== "lunas")
    .reduce((acc, inv) => acc + Number(inv.outstandingAmount || inv.totalAmount || 0), 0);

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Memuat SKEU Keuangan Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Component */}
      <SkeuSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invoicesCount={invoices.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <SkeuHeader
          adminUser={adminUser}
          setShowClearanceModal={setShowClearanceModal}
        />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "beranda" && (
            <BerandaTab
              invoicesCount={invoices.length}
              paymentsCount={payments.length}
              totalRevenue={totalRevenue}
              totalOutstanding={totalOutstanding}
              setShowClearanceModal={setShowClearanceModal}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "penerimaan" && (
            <PenerimaanTab
              invoices={invoices}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              invoiceFilterStatus={invoiceFilterStatus}
              setInvoiceFilterStatus={setInvoiceFilterStatus}
              handleExportInvoicesCsv={handleExportInvoicesCsv}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "pmb" && (
            <PmbFeesTab
              pmbFeeRates={pmbFeeRates}
              setShowPmbFeeModal={setShowPmbFeeModal}
              setEditingPmbFee={setEditingPmbFee}
              setPmbFeeForm={setPmbFeeForm}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "beasiswa" && (
            <BeasiswaTab triggerNotice={triggerNotice} />
          )}

          {activeTab === "pengeluaran" && (
            <PengeluaranTab triggerNotice={triggerNotice} />
          )}

          {activeTab === "akuntansi" && (
            <AkuntansiTab coa={coa} triggerNotice={triggerNotice} />
          )}

          {activeTab === "pengaturan" && (
            <PengaturanTab rates={rates} triggerNotice={triggerNotice} />
          )}
        </main>
      </div>

      {/* Modal Dialog Suite */}
      <SkeuModals
        showClearanceModal={showClearanceModal}
        setShowClearanceModal={setShowClearanceModal}
        clearanceNIM={clearanceNIM}
        setClearanceNIM={setClearanceNIM}
        clearanceResult={clearanceResult}
        handleCheckClearance={handleCheckClearance}
        showPmbFeeModal={showPmbFeeModal}
        setShowPmbFeeModal={setShowPmbFeeModal}
        editingPmbFee={editingPmbFee}
        pmbFeeForm={pmbFeeForm}
        setPmbFeeForm={setPmbFeeForm}
        savingPmbFee={savingPmbFee}
        handleSavePmbFee={handleSavePmbFee}
      />

      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-[#FED524]">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
