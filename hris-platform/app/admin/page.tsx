"use client";

import React, { useState, useEffect } from "react";
import { SSO_AUTHORIZE_URL, SSO_CLIENT_ID, SSO_CALLBACK_URL } from "@/lib/client-config";

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Position {
  id: string;
  name: string;
  abbreviation: string;
  functionalAllowance: number;
}

interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: "dosen" | "tendik";
  organizationUnitId: string;
  positionId: string;
  rankGroup: string;
  baseSalary: number;
  status: "aktif" | "non_aktif" | "pensiun" | "cuti_panjang";
  bankName: string;
  bankAccountNumber: string;
}


interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeNumber: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "menunggu" | "disetujui" | "ditolak";
  requestedAt: string;
}

interface PayrollRun {
  id: string;
  period: string;
  cutoffDate: string;
  disburseTargetDate: string;
  status: "berjalan" | "selesai";
  eligibleEmployeeCount: number;
  totalGross: number;
  totalNet: number;
  steps: {
    stepName: "persiapan_data" | "validasi_absensi_bkd" | "kalkulasi" | "persetujuan" | "disburse_slip";
    status: "pending" | "berjalan" | "selesai";
    anomalyNote?: string | null;
  }[];
}

interface Payslip {
  id: string;
  employeeName: string;
  employeeNumber: string;
  period: string;
  baseSalary: number;
  pdfUrl: string;
  status: "draft" | "published" | "paid";
  bankName?: string;
  bankAccountNumber?: string;
  items: {
    componentName: string;
    category: string;
    amount: number;
  }[];
}

export default function HrisAdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "karyawan" | "presensi" | "cuti" | "struktur" | "payroll" | "pengaturan"
  >("dashboard");

  // Core Data
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [positionsList, setPositionsList] = useState<Position[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [leaveRequestsList, setLeaveRequestsList] = useState<LeaveRequest[]>([]);
  const [payrollRunsList, setPayrollRunsList] = useState<PayrollRun[]>([]);
  const [payslipsList, setPayslipsList] = useState<Payslip[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [karyawanFilterType, setKaryawanFilterType] = useState<"all" | "dosen" | "tendik">("all");
  const [karyawanFilterStatus, setKaryawanFilterStatus] = useState<"all" | "aktif" | "non_aktif">("all");

  // UI Control
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // Modals & Drawers
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [provinsi, setProvinsi] = useState("");
  const [kota, setKota] = useState("");
  const [provincesData, setProvincesData] = useState<Record<string, string[]>>({});
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({ type: "unit", id: "", code: "", name: "", unitType: "prodi", abbreviation: "", functionalAllowance: 0, rankGroup: "III/a" });
  
  // Payroll Creation Form
  const [showPayrollCreateModal, setShowPayrollCreateModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ period: "Mei 2026", cutoffDate: "2026-05-20", disburseTargetDate: "2026-05-25" });
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Auth State
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectToSSO = () => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    sessionStorage.setItem("sso_code_verifier", verifier);

    let authUrl = SSO_AUTHORIZE_URL;
    let cbUrl = SSO_CALLBACK_URL;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1" && authUrl.includes("localhost")) {
        authUrl = authUrl.replace("localhost", host);
      }
      const currentHost = window.location.host;
      cbUrl = `${window.location.protocol}//${currentHost}/api/auth/callback`;
    }

    window.location.href = `${authUrl}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(cbUrl)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.authenticated && data.user && data.user.role === "admin") {
        setAdminUser(data.user);
        setCheckingAuth(false);
        await Promise.all([fetchCoreData(), fetchLeaveRequests(), fetchPayrollRuns()]);
      } else {
        redirectToSSO();
      }
    } catch (err) {
      redirectToSSO();
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const fetchCoreData = async () => {
    try {
      const res = await fetch("/api/admin/data");
      const data = await res.json();
      if (data.success) {
        setUnits(data.units || []);
        setPositionsList(data.positions || []);
        setEmployeesList(data.employees || []);
        setProvincesData(data.regions || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("/api/admin/leaves");
      const data = await res.json();
      if (data.success) {
        setLeaveRequestsList(data.leaveRequests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrollRuns = async () => {
    try {
      const res = await fetch("/api/admin/payroll/run");
      const data = await res.json();
      if (data.success) {
        setPayrollRunsList(data.runs || []);
        // If there are runs, auto-fetch payslips for the latest run
        if (data.runs.length > 0) {
          fetchPayslips(data.runs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayslips = async (runId: string) => {
    try {
      const res = await fetch(`/api/admin/payroll/payslips?runId=${runId}`);
      const data = await res.json();
      if (data.success) {
        setPayslipsList(data.payslips || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Actions
  const handleTriggerSync = async () => {
    triggerNotice("Memulai sinkronisasi database pegawai...");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Sinkronisasi berhasil!");
        fetchCoreData();
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
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length <= 1) {
        triggerNotice("CSV kosong atau format salah!");
        return;
      }
      triggerNotice(`Memproses import ${lines.length - 1} data pegawai dari CSV...`);
      try {
        const res = await fetch("/api/admin/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });
        const data = await res.json();
        if (data.success) {
          triggerNotice(`Sukses mengimpor ${data.count} data pegawai baru!`);
          fetchCoreData();
        } else {
          triggerNotice("Gagal mengimpor: " + data.error);
        }
      } catch (err: any) {
        triggerNotice("Galat jaringan: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message);
        setShowEmployeeModal(false);
        fetchCoreData();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Gagal menyimpan data.");
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message);
        setShowOrgModal(false);
        fetchCoreData();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err) {
      triggerNotice("Gagal menyimpan.");
    }
  };

  const handleUpdateLeaveStatus = async (id: string, status: "disetujui" | "ditolak") => {
    try {
      const res = await fetch("/api/admin/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message);
        fetchLeaveRequests();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err) {
      triggerNotice("Gagal memproses permohonan.");
    }
  };

  const handleCreatePayrollRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...payrollForm }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Periode payroll baru berhasil dibuat!");
        setShowPayrollCreateModal(false);
        fetchPayrollRuns();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err) {
      triggerNotice("Gagal membuat payroll.");
    }
  };

  const handleExecutePayrollStep = async (runId: string, stepName: string) => {
    triggerNotice(`Memproses tahapan: ${stepName.replace("_", " ")}...`);
    try {
      const res = await fetch("/api/admin/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_step", runId, stepName }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(`Tahapan ${stepName.replace("_", " ")} selesai!`);
        fetchPayrollRuns();
      } else {
        triggerNotice("Gagal tahapan: " + data.error);
      }
    } catch (err) {
      triggerNotice("Gagal mengeksekusi tahapan.");
    }
  };

  const handleLogout = () => {
    document.cookie = "hris_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/login";
  };

  // Filters
  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = karyawanFilterType === "all" || emp.employeeType === karyawanFilterType;
    const matchesStatus = karyawanFilterStatus === "all" || emp.status === karyawanFilterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activePayroll = payrollRunsList.find((r) => r.status === "berjalan");

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {checkingAuth ? "Memvalidasi Sesi SSO..." : "Memuat Portal HRIS..."}
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
          <div className="w-10 h-10 rounded-xl bg-[#FED524] flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg">
            UN
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">HRIS Portal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Universitas Siber Asia</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {adminUser?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-200 truncate">{adminUser?.name}</p>
            <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase">Biro Kepegawaian & SDM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📊 Beranda
          </button>
          <button
            onClick={() => setActiveTab("karyawan")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              activeTab === "karyawan" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            📋 Data Karyawan
          </button>
          <button
            onClick={() => setActiveTab("presensi")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              activeTab === "presensi" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            🕒 Presensi Kerja
          </button>
          <button
            onClick={() => setActiveTab("cuti")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition relative ${
              activeTab === "cuti" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            🌴 Cuti & Lembur
            {leaveRequestsList.filter(l => l.status === "menunggu").length > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {leaveRequestsList.filter(l => l.status === "menunggu").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("struktur")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              activeTab === "struktur" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            🏢 Jabatan & Struktur
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition relative ${
              activeTab === "payroll" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            💰 Run Penggajian
            {activePayroll && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pengaturan")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              activeTab === "pengaturan" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            ⚙️ Pengaturan
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-450 rounded-xl font-bold text-xs uppercase tracking-wider transition"
          >
            👋 Keluar Sesi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0d111a]">
        {/* TOP HEADER */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b0f19]/60 backdrop-blur-md shrink-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              {activeTab === "dashboard" && "Dashboard Ringkasan"}
              {activeTab === "karyawan" && "Direktori Karyawan"}
              {activeTab === "presensi" && "Log Presensi & Kehadiran"}
              {activeTab === "cuti" && "Pengajuan Cuti Pegawai"}
              {activeTab === "struktur" && "Master Jabatan & Unit Kerja"}
              {activeTab === "payroll" && "Run Payroll Terintegrasi"}
              {activeTab === "pengaturan" && "Pengaturan & Sinkronisasi"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari NIP, nama..."
              className="px-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-200 outline-none w-60 transition"
            />
            <button
              onClick={handleTriggerSync}
              className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              🔄 Sync SSO
            </button>
          </div>
        </header>

        {/* PANELS WRAPPER */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">👥</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      Aktif
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white">{employeesList.length}</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Total Karyawan</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">🧑‍🏫</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      Dosen
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {employeesList.filter(e => e.employeeType === "dosen").length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Tenaga Pendidik</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">💼</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      Tendik
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {employeesList.filter(e => e.employeeType === "tendik").length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Kependidikan</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">💰</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                      Payroll YTD
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    Rp {(employeesList.reduce((acc, curr) => acc + curr.baseSalary, 0) / 1000000).toFixed(1)} jt
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Estimasi Gaji Pokok</p>
                </div>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual SVG composition chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Komposisi Pegawai per Unit Kerja</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span> Dosen</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FED524] rounded-sm"></span> Tendik</span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center p-4">
                    <svg viewBox="0 0 600 220" className="w-full h-auto">
                      <line x1="32" y1="180" x2="580" y2="180" stroke="#1e293b" strokeWidth="1"/>
                      <line x1="32" y1="120" x2="580" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4"/>
                      <line x1="32" y1="60" x2="580" y2="60" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4"/>

                      {/* Bar 1: FTI */}
                      <rect x="70" y="50" width="24" height="130" fill="#2563eb" rx="2"/>
                      <rect x="96" y="140" width="24" height="40" fill="#FED524" rx="2"/>
                      <text x="95" y="200" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">Teknologi Informasi</text>

                      {/* Bar 2: SDM */}
                      <rect x="220" y="120" width="24" height="60" fill="#2563eb" rx="2"/>
                      <rect x="246" y="90" width="24" height="90" fill="#FED524" rx="2"/>
                      <text x="245" y="200" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">Biro Kepegawaian</text>

                      {/* Bar 3: FEB */}
                      <rect x="370" y="70" width="24" height="110" fill="#2563eb" rx="2"/>
                      <rect x="396" y="130" width="24" height="50" fill="#FED524" rx="2"/>
                      <text x="395" y="200" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">Ekon. & Bisnis</text>

                      {/* Bar 4: Fikom */}
                      <rect x="490" y="100" width="24" height="80" fill="#2563eb" rx="2"/>
                      <rect x="516" y="150" width="24" height="30" fill="#FED524" rx="2"/>
                      <text x="515" y="200" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">Ilmu Komunikasi</text>
                    </svg>
                  </div>
                </div>

                {/* Today's Absensi Log */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hari Ini (Presensi)</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Hadir</span>
                        <span className="text-sm font-bold text-emerald-400">{Math.floor(employeesList.length * 0.85)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Terlambat</span>
                        <span className="text-sm font-bold text-yellow-400">{Math.floor(employeesList.length * 0.05)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">WFH</span>
                        <span className="text-sm font-bold text-blue-400">{Math.floor(employeesList.length * 0.08)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Cuti</span>
                        <span className="text-sm font-bold text-purple-400">2</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Terdata</span>
                    <span className="text-xl font-black text-white">{employeesList.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA KARYAWAN */}
          {activeTab === "karyawan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setKaryawanFilterType("all")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      karyawanFilterType === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Semua Tipe
                  </button>
                  <button
                    onClick={() => setKaryawanFilterType("dosen")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      karyawanFilterType === "dosen" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Dosen
                  </button>
                  <button
                    onClick={() => setKaryawanFilterType("tendik")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      karyawanFilterType === "tendik" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Tendik
                  </button>
                  <div className="w-px h-6 bg-slate-800 mx-2"></div>
                  <button
                    onClick={() => setKaryawanFilterStatus("all")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      karyawanFilterStatus === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    onClick={() => setKaryawanFilterStatus("aktif")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                      karyawanFilterStatus === "aktif" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Aktif
                  </button>
                </div>

                {/* Import/Create Actions */}
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center">
                    📥 Import CSV
                    <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                  </label>
                  <button
                    onClick={() => {
                      setEditingEmployee({
                        fullName: "",
                        employeeNumber: "",
                        employeeType: "dosen",
                        organizationUnitId: units[0]?.id || "",
                        positionId: positionsList[0]?.id || "",
                        rankGroup: "III/a",
                        baseSalary: 4500000,
                        status: "aktif",
                        bankName: "Mandiri",
                        bankAccountNumber: "",
                      });
                      setShowEmployeeModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 transition flex items-center gap-1.5"
                  >
                    ➕ Karyawan Baru
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-6 py-4">Pegawai</th>
                        <th className="px-6 py-4">Tipe</th>
                        <th className="px-6 py-4">Jabatan & Unit</th>
                        <th className="px-6 py-4">Gaji Pokok</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredEmployees.map((emp) => {
                        const unitObj = units.find((u) => u.id === emp.organizationUnitId);
                        const posObj = positionsList.find((p) => p.id === emp.positionId);
                        return (
                          <tr key={emp.id} className="hover:bg-slate-850/50 transition">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-200 text-sm">{emp.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.employeeNumber}</div>
                            </td>
                            <td className="px-6 py-4 uppercase font-bold text-[10px]">
                              <span className={`px-2 py-0.5 rounded ${emp.employeeType === "dosen" ? "bg-violet-500/15 text-violet-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                                {emp.employeeType}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-300">{posObj?.name || "—"}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{unitObj?.name || "—"}</div>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-300">
                              Rp {emp.baseSalary?.toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider ${emp.status === "aktif" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-450"}`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setShowEmployeeModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-750 text-slate-300 font-bold rounded-lg transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">Tidak ada pegawai yang ditemukan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRESENSI */}
          {activeTab === "presensi" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm">Absensi Karyawan Hari Ini</h3>
                  <span className="text-xs text-slate-400 font-mono">Mei 2026</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="pb-3">Pegawai</th>
                        <th className="pb-3">Tanggal</th>
                        <th className="pb-3">Check In</th>
                        <th className="pb-3">Check Out</th>
                        <th className="pb-3">Jam Kerja</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {employeesList.map((emp, i) => (
                        <tr key={emp.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-3.5">
                            <div className="font-semibold text-slate-300">{emp.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.employeeNumber}</div>
                          </td>
                          <td className="py-3.5 text-slate-400 font-mono">20-05-2026</td>
                          <td className="py-3.5 text-slate-450 font-mono">{i % 3 === 0 ? "08:15" : "07:55"}</td>
                          <td className="py-3.5 text-slate-450 font-mono">17:00</td>
                          <td className="py-3.5 text-slate-300 font-mono">8.00 jam</td>
                          <td className="py-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${i % 3 === 0 ? "bg-yellow-500/15 text-yellow-450 border border-yellow-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"}`}>
                              {i % 3 === 0 ? "Terlambat" : "Hadir"}
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

          {/* TAB 4: CUTI */}
          {activeTab === "cuti" && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-6">Persetujuan Cuti Pegawai</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="pb-3">Pegawai</th>
                        <th className="pb-3">Jenis Cuti</th>
                        <th className="pb-3">Tanggal</th>
                        <th className="pb-3">Alasan</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {leaveRequestsList.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-4">
                            <div className="font-bold text-slate-200">{req.employeeName}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{req.employeeNumber}</div>
                          </td>
                          <td className="py-4 text-slate-350">{req.leaveTypeName}</td>
                          <td className="py-4 font-mono text-[11px] text-slate-400">
                            {req.startDate} s/d {req.endDate}
                          </td>
                          <td className="py-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              req.status === "menunggu" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              req.status === "disetujui" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {req.status === "menunggu" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateLeaveStatus(req.id, "disetujui")}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateLeaveStatus(req.id, "ditolak")}
                                  className="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-450 text-[10px] font-bold rounded-lg transition"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">Selesai diproses</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {leaveRequestsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada pengajuan cuti.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STRUKTUR & JABATAN */}
          {activeTab === "struktur" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* UNITS LIST */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm">🏢 Unit Organisasi</h3>
                  <button
                    onClick={() => {
                      setOrgForm({ type: "unit", id: "", code: "", name: "", unitType: "prodi", abbreviation: "", functionalAllowance: 0, rankGroup: "III/a" });
                      setShowOrgModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
                  >
                    Tambah Unit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="pb-3">Kode</th>
                        <th className="pb-3">Nama Unit</th>
                        <th className="pb-3">Tipe</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {units.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-3 font-mono text-[#FED524]">{u.code}</td>
                          <td className="py-3 font-semibold text-slate-200">{u.name}</td>
                          <td className="py-3 uppercase text-[9px] font-black text-slate-550">{u.type}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setOrgForm({ type: "unit", id: u.id, code: u.code, name: u.name, unitType: u.type, abbreviation: "", functionalAllowance: 0, rankGroup: "III/a" });
                                setShowOrgModal(true);
                              }}
                              className="text-blue-450 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POSITIONS LIST */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm">👔 Jabatan</h3>
                  <button
                    onClick={() => {
                      setOrgForm({ type: "position", id: "", code: "", name: "", unitType: "prodi", abbreviation: "", functionalAllowance: 1000000, rankGroup: "III/a" });
                      setShowOrgModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
                  >
                    Tambah Jabatan
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="pb-3">Singkatan</th>
                        <th className="pb-3">Nama Jabatan</th>
                        <th className="pb-3">Tunjangan</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {positionsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-3 font-mono text-[#FED524]">{p.abbreviation}</td>
                          <td className="py-3 font-semibold text-slate-200">{p.name}</td>
                          <td className="py-3 font-mono text-slate-350">Rp {p.functionalAllowance.toLocaleString("id-ID")}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setOrgForm({ type: "position", id: p.id, code: "", name: p.name, unitType: "", abbreviation: p.abbreviation, functionalAllowance: p.functionalAllowance, rankGroup: "" });
                                setShowOrgModal(true);
                              }}
                              className="text-blue-450 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PAYROLL */}
          {activeTab === "payroll" && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Siklus Penggajian Aktif</h3>
                    <p className="text-xs text-slate-400 mt-1">Gunakan tombol di bawah untuk menyelesaikan 5 tahapan penggajian secara berurutan.</p>
                  </div>
                  {!activePayroll && (
                    <button
                      onClick={() => setShowPayrollCreateModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                      ➕ Buka Periode Baru
                    </button>
                  )}
                </div>

                {activePayroll ? (
                  <div className="space-y-6">
                    {/* Run Details */}
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Periode</div>
                        <div className="text-sm font-bold text-slate-200 mt-0.5">{activePayroll.period}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Karyawan</div>
                        <div className="text-sm font-bold text-slate-200 mt-0.5">{activePayroll.eligibleEmployeeCount} Orang</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Pengeluaran Gross</div>
                        <div className="text-sm font-bold text-blue-400 mt-0.5">Rp {activePayroll.totalGross.toLocaleString("id-ID")}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Net (Take-Home-Pay)</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">Rp {activePayroll.totalNet.toLocaleString("id-ID")}</div>
                      </div>
                    </div>

                    {/* Step Wizard rendering */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {activePayroll.steps.map((step) => {
                        const stepTitles = {
                          persiapan_data: "1. Persiapan Data",
                          validasi_absensi_bkd: "2. Validasi Absensi",
                          kalkulasi: "3. Kalkulasi Gaji",
                          persetujuan: "4. Persetujuan",
                          disburse_slip: "5. Disburse & Slip"
                        };
                        return (
                          <div
                            key={step.stepName}
                            className={`border rounded-xl p-4 transition ${
                              step.status === "selesai" ? "bg-emerald-500/10 border-emerald-500/30" :
                              step.status === "berjalan" ? "bg-blue-600/15 border-blue-500/50" :
                              "bg-slate-950/20 border-slate-800"
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-200">{stepTitles[step.stepName]}</div>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                step.status === "selesai" ? "bg-emerald-500/20 text-emerald-400" :
                                step.status === "berjalan" ? "bg-blue-600/30 text-blue-400 animate-pulse" :
                                "bg-slate-800 text-slate-500"
                              }`}>
                                {step.status}
                              </span>
                              {step.status === "berjalan" && (
                                <button
                                  onClick={() => handleExecutePayrollStep(activePayroll.id, step.stepName)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-[9px] text-white font-bold rounded"
                                >
                                  Proses
                                </button>
                              )}
                            </div>
                            {step.anomalyNote && (
                              <p className="text-[10px] text-slate-400 mt-2 italic leading-tight">
                                💡 {step.anomalyNote}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">Tidak ada run payroll aktif berjalan.</div>
                )}
              </div>

              {/* Generated Payslips */}
              {payslipsList.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm mb-4">Slip Gaji Terbit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payslipsList.map((slip) => (
                      <div
                        key={slip.id}
                        onClick={() => setSelectedPayslip(slip)}
                        className="bg-slate-950/40 border border-slate-850 hover:border-blue-600 rounded-xl p-4 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-200">{slip.employeeName}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{slip.employeeNumber}</div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                            {slip.status}
                          </span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-850 flex justify-between text-xs">
                          <span className="text-slate-400">Gaji Pokok:</span>
                          <span className="font-bold font-mono text-slate-300">Rp {slip.baseSalary.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PENGATURAN */}
          {activeTab === "pengaturan" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl animate-fade-in space-y-6">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm border-b border-slate-800 pb-3">Pengaturan Integrasi Kepegawaian</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-slate-850">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Koneksi SIAKAD (BKD Dosen)</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sinkronisasi beban mengajar dosen dan evaluasi kaprodi.</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Terhubung
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-slate-850">
                  <div>
                    <div className="text-xs font-bold text-slate-200">Koneksi Sistem Keuangan (Disbursement)</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Webhook transfer payroll massal & penjurnalan buku besar.</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Terhubung
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: CREATE PAYROLL RUN */}
      {showPayrollCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePayrollRun} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Mulai Periode Payroll Baru</h3>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Periode (Bulan & Tahun)</label>
              <input
                type="text"
                value={payrollForm.period}
                onChange={(e) => setPayrollForm({ ...payrollForm, period: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal Cutoff</label>
              <input
                type="date"
                value={payrollForm.cutoffDate}
                onChange={(e) => setPayrollForm({ ...payrollForm, cutoffDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal Rencana Bayar</label>
              <input
                type="date"
                value={payrollForm.disburseTargetDate}
                onChange={(e) => setPayrollForm({ ...payrollForm, disburseTargetDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowPayrollCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Buka Periode
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showEmployeeModal && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveEmployee} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="font-bold text-white text-base">
              {editingEmployee.id ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.fullName || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">NIP / NIDN</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.employeeNumber || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Tipe Pegawai</label>
                <select
                  value={editingEmployee.employeeType || "dosen"}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeType: e.target.value as "dosen" | "tendik" })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                >
                  <option value="dosen">Dosen</option>
                  <option value="tendik">Tendik</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Unit Organisasi</label>
                <select
                  value={editingEmployee.organizationUnitId || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, organizationUnitId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Jabatan Utama</label>
                <select
                  value={editingEmployee.positionId || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, positionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                >
                  {positionsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Golongan / Ruang</label>
                <input
                  type="text"
                  value={editingEmployee.rankGroup || "III/a"}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, rankGroup: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Gaji Pokok</label>
                <input
                  type="number"
                  value={editingEmployee.baseSalary || 0}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, baseSalary: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Status Kepegawaian</label>
                <select
                  value={editingEmployee.status || "aktif"}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                >
                  <option value="aktif">Aktif</option>
                  <option value="non_aktif">Non Aktif</option>
                  <option value="pensiun">Pensiun</option>
                  <option value="cuti_panjang">Cuti Panjang</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Provinsi (Alamat KTP)</label>
                <select
                  value={provinsi}
                  onChange={(e) => {
                    setProvinsi(e.target.value);
                    setKota("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                >
                  <option value="">Pilih Provinsi</option>
                  {Object.keys(provincesData).map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Kota / Kabupaten</label>
                <select
                  value={kota}
                  disabled={!provinsi}
                  onChange={(e) => setKota(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 disabled:bg-slate-900 disabled:text-slate-600"
                >
                  <option value="">{provinsi ? "Pilih Kota/Kab" : "Pilih Provinsi Dahulu"}</option>
                  {provinsi && (provincesData[provinsi] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={editingEmployee.bankName || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={editingEmployee.bankAccountNumber || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT UNIT & POSITION */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveOrg} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">
              {orgForm.id ? "Edit Item Master" : "Tambah Item Master"}
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Tipe Entitas</label>
              <select
                value={orgForm.type}
                disabled={!!orgForm.id}
                onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
              >
                <option value="unit">Unit Organisasi</option>
                <option value="position">Jabatan</option>
              </select>
            </div>

            {orgForm.type === "unit" ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Kode Unit</label>
                  <input
                    type="text"
                    required
                    value={orgForm.code}
                    onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Nama Unit</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Tipe Unit</label>
                  <select
                    value={orgForm.unitType}
                    onChange={(e) => setOrgForm({ ...orgForm, unitType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  >
                    <option value="fakultas">Fakultas</option>
                    <option value="prodi">Program Studi</option>
                    <option value="biro">Biro</option>
                    <option value="unit">Unit Kerja Lainnya</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Nama Jabatan</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Singkatan Kode Jabatan</label>
                  <input
                    type="text"
                    required
                    value={orgForm.abbreviation}
                    onChange={(e) => setOrgForm({ ...orgForm, abbreviation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Tunjangan Fungsional</label>
                  <input
                    type="number"
                    value={orgForm.functionalAllowance}
                    onChange={(e) => setOrgForm({ ...orgForm, functionalAllowance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowOrgModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PAYSLIP DETAIL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg">Slip Gaji Karyawan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Periode: {selectedPayslip.period}</p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Block */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Nama Lengkap</span>
                  <span className="font-bold text-slate-200">{selectedPayslip.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">NIP / NIDN</span>
                  <span className="font-bold text-slate-200 font-mono">{selectedPayslip.employeeNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Metode Pembayaran</span>
                  <span className="font-bold text-slate-200">{selectedPayslip.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Rekening</span>
                  <span className="font-bold text-slate-200 font-mono">{selectedPayslip.bankAccountNumber}</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rincian Pendapatan & Potongan</h4>
                <div className="space-y-2 text-xs">
                  {selectedPayslip.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-slate-350">{item.componentName}</span>
                      <span className={`font-mono font-bold ${item.category === "potongan" ? "text-rose-400" : "text-slate-200"}`}>
                        {item.category === "potongan" ? "-" : ""}Rp {item.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Net Amount */}
              <div className="border-t border-slate-800 pt-4 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Take Home Pay (Net)</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  Rp {(selectedPayslip.items.reduce((acc, curr) => curr.category === "potongan" ? acc - curr.amount : acc + curr.amount, 0)).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={selectedPayslip.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                📥 Unduh PDF
              </a>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-bold text-xs px-5 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-2 animate-bounce">
          <span>✨</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
