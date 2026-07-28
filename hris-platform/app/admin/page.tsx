"use client";

import React, { useState, useEffect } from "react";
import HrisSidebar, { HrisTabType } from "./components/HrisSidebar";
import HrisHeader from "./components/HrisHeader";
import HrisModals from "./components/HrisModals";

// Tab Components
import DashboardTab from "./components/tabs/DashboardTab";
import KaryawanTab from "./components/tabs/KaryawanTab";
import PresensiTab from "./components/tabs/PresensiTab";
import CutiTab from "./components/tabs/CutiTab";
import StrukturTab from "./components/tabs/StrukturTab";
import PayrollTab from "./components/tabs/PayrollTab";
import PengaturanTab from "./components/tabs/PengaturanTab";

export interface OrgUnit {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface Position {
  id: string;
  name: string;
  abbreviation: string;
  functionalAllowance: number;
}

export interface Employee {
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

export interface LeaveRequest {
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

export interface PayrollRun {
  id: string;
  period: string;
  cutoffDate: string;
  disburseTargetDate: string;
  status: "berjalan" | "selesai";
  eligibleEmployeeCount: number;
  totalGross: number;
  totalNet: number;
  steps: {
    stepName: string;
    status: string;
    anomalyNote?: string | null;
  }[];
}

export interface Payslip {
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
  const [activeTab, setActiveTab] = useState<HrisTabType>("dashboard");

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
  const [filterUnitId, setFilterUnitId] = useState("all");

  // UI Control
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);

  // Drawer & Modal State
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    employeeNumber: "",
    fullName: "",
    employeeType: "dosen",
    organizationUnitId: "",
    positionId: "",
    rankGroup: "III/c",
    baseSalary: 4500000,
    status: "aktif",
    bankName: "Bank Mandiri",
    bankAccountNumber: "1230009988",
  });

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
        const allowedRoles = ["admin", "superadmin", "super_admin", "staff_hris", "pegawai"];
        if (data.success && data.authenticated && data.user && allowedRoles.includes(data.user.role)) {
          setAdminUser(data.user);
          fetchOverview();
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
      const res = await fetch("/api/admin/hris-overview");
      const data = await res.json();
      if (data.success && data.data) {
        setUnits(data.data.units || []);
        setPositionsList(data.data.positions || []);
        setEmployeesList(data.data.employees || []);
        setLeaveRequestsList(data.data.leaveRequests || []);
        setPayrollRunsList(data.data.payrollRuns || []);
        setPayslipsList(data.data.payslips || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmployee(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice("Pegawai baru berhasil didaftarkan ke HRIS & synced ke SSO!");
        setShowEmployeeModal(false);
        fetchOverview();
      } else {
        triggerNotice("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerNotice(err.message);
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleApproveLeave = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/leave-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "disetujui" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(`Pengajuan cuti ${name} telah disetujui!`);
        fetchOverview();
      }
    } catch (err: any) {
      triggerNotice(err.message);
    }
  };

  const handleRejectLeave = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/leave-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ditolak" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(`Pengajuan cuti ${name} ditolak.`);
        fetchOverview();
      }
    } catch (err: any) {
      triggerNotice(err.message);
    }
  };

  const handleExportEmployeesCsv = () => {
    if (employeesList.length === 0) {
      triggerNotice("Tidak ada data pegawai untuk diekspor.");
      return;
    }
    const filtered = employeesList.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = karyawanFilterType === "all" || emp.employeeType === karyawanFilterType;
      const matchesStatus = karyawanFilterStatus === "all" || emp.status === karyawanFilterStatus;
      const matchesUnit = filterUnitId === "all" || emp.organizationUnitId === filterUnitId;
      return matchesSearch && matchesType && matchesStatus && matchesUnit;
    });

    const headers = ["NIP/NIDN", "Nama Lengkap", "Tipe", "Unit Kerja", "Jabatan", "Golongan", "Gaji Pokok", "Status", "Bank", "No. Rekening"];
    const rows = filtered.map((emp) => {
      const unitObj = units.find((u) => u.id === emp.organizationUnitId);
      const posObj = positionsList.find((p) => p.id === emp.positionId);
      return [
        `"${emp.employeeNumber || ""}"`,
        `"${emp.fullName || ""}"`,
        `"${emp.employeeType || ""}"`,
        `"${unitObj?.name || ""}"`,
        `"${posObj?.name || ""}"`,
        `"${emp.rankGroup || ""}"`,
        `"${emp.baseSalary || 0}"`,
        `"${emp.status || ""}"`,
        `"${emp.bankName || ""}"`,
        `"${emp.bankAccountNumber || ""}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pegawai_HRIS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotice(`Sukses mengunduh ${filtered.length} data pegawai ke CSV!`);
  };

  const dosenCount = employeesList.filter((e) => e.employeeType === "dosen").length;
  const tendikCount = employeesList.filter((e) => e.employeeType === "tendik").length;
  const pendingLeaves = leaveRequestsList.filter((l) => l.status === "menunggu").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Memuat HRIS SDM Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Component */}
      <HrisSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        employeesCount={employeesList.length}
        leaveRequestsCount={pendingLeaves}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <HrisHeader adminUser={adminUser} />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "dashboard" && (
            <DashboardTab
              employeesCount={employeesList.length}
              leaveRequestsCount={pendingLeaves}
              dosenCount={dosenCount}
              tendikCount={tendikCount}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "karyawan" && (
            <KaryawanTab
              employeesList={employeesList}
              units={units}
              positionsList={positionsList}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              karyawanFilterType={karyawanFilterType}
              setKaryawanFilterType={setKaryawanFilterType}
              karyawanFilterStatus={karyawanFilterStatus}
              setKaryawanFilterStatus={setKaryawanFilterStatus}
              filterUnitId={filterUnitId}
              setFilterUnitId={setFilterUnitId}
              setShowEmployeeModal={setShowEmployeeModal}
              setSelectedEmployeeDetail={setSelectedEmployeeDetail}
              handleExportEmployeesCsv={handleExportEmployeesCsv}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "presensi" && (
            <PresensiTab triggerNotice={triggerNotice} />
          )}

          {activeTab === "cuti" && (
            <CutiTab
              leaveRequestsList={leaveRequestsList}
              handleApproveLeave={handleApproveLeave}
              handleRejectLeave={handleRejectLeave}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "struktur" && (
            <StrukturTab
              units={units}
              positionsList={positionsList}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollTab
              payrollRunsList={payrollRunsList}
              payslipsList={payslipsList}
              triggerNotice={triggerNotice}
            />
          )}

          {activeTab === "pengaturan" && (
            <PengaturanTab triggerNotice={triggerNotice} />
          )}
        </main>
      </div>

      {/* Modal & Drawer Suite */}
      <HrisModals
        showEmployeeModal={showEmployeeModal}
        setShowEmployeeModal={setShowEmployeeModal}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        units={units}
        positionsList={positionsList}
        savingEmployee={savingEmployee}
        handleSaveEmployee={handleSaveEmployee}
        selectedEmployeeDetail={selectedEmployeeDetail}
        setSelectedEmployeeDetail={setSelectedEmployeeDetail}
      />

      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-purple-400">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
