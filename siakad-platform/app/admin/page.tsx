"use client";

import { useState, useEffect } from "react";
import AdminSidebar, { AdminTab } from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminModals, { ModalType } from "./components/AdminModals";

// Tab Components
import DashboardTab from "./components/tabs/DashboardTab";
import ProdiTab from "./components/tabs/ProdiTab";
import TahunAjaranTab from "./components/tabs/TahunAjaranTab";
import PeriodeTab from "./components/tabs/PeriodeTab";
import KurikulumTab from "./components/tabs/KurikulumTab";
import MatakuliahTab from "./components/tabs/MatakuliahTab";
import KelasTab from "./components/tabs/KelasTab";
import JadwalTab from "./components/tabs/JadwalTab";
import NilaiTab from "./components/tabs/NilaiTab";
import KrsValidationTab from "./components/tabs/KrsValidationTab";
import MahasiswaTab from "./components/tabs/MahasiswaTab";
import DosenTab from "./components/tabs/DosenTab";
import PersuratanTab from "./components/tabs/PersuratanTab";
import PddiktiTab from "./components/tabs/PddiktiTab";
import AuditLogsTab from "./components/tabs/AuditLogsTab";
import LaporanTab from "./components/tabs/LaporanTab";
import PengaturanTab from "./components/tabs/PengaturanTab";

export interface KrsSubmission {
  id: string;
  name: string;
  nim: string;
  sksCount: number;
  courses: string[];
  status?: string;
}

export default function AcademicAdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [submissions, setSubmissions] = useState<KrsSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<KrsSubmission | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalForm, setModalForm] = useState<Record<string, string>>({});

  // Auth state
  const [adminUser, setAdminUser] = useState<{
    name: string;
    username: string;
    role: string;
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [overviewData, setOverviewData] = useState<{
    stats: {
      mahasiswaAktif: number;
      dosenAktif: number;
      kelasBerjalan: number;
      totalMataKuliah: number;
      totalKurikulum: number;
      krsPending: number;
    };
    periodeAktif: {
      name: string;
      status: string;
      startDate: string;
      endDate: string;
    };
    integrasiSistem: Record<string, string>;
  } | null>(null);

  const redirectToSSO = () => {
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        const adminRoles = [
          "admin",
          "superadmin",
          "super_admin",
          "admin_siakad",
          "super_admin_siakad",
          "staff_akademik",
          "dosen",
          "pegawai",
          "kaprodi",
          "mahasiswa",
          "user",
        ];
        if (
          data.success &&
          data.authenticated &&
          data.user &&
          (adminRoles.includes(data.user.role) || (data.user.roles && data.user.roles.some((r: string) => adminRoles.includes(r))))
        ) {
          setAdminUser(data.user);
          setCheckingAuth(false);
          fetchSubmissions();
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
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.success && data.data) {
        setOverviewData(data.data);
      }
    } catch {}
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/admin/krs-submissions");
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
        if (data.submissions?.length > 0) {
          setSelectedSub(data.submissions[0]);
        }
      }
    } catch {}
  };

  const handleKrsApprove = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/krs-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId: id, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS ${name} berhasil disetujui (Approved)`);
        setSelectedSub(null);
        setRejectNote("");
        fetchSubmissions();
      } else {
        triggerToast(data.error || "Gagal menyetujui KRS");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const handleKrsReject = async (id: string, name: string) => {
    if (!rejectNote) {
      triggerToast("Catatan penolakan wajib diisi");
      return;
    }
    try {
      const res = await fetch("/api/admin/krs-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId: id, action: "reject", note: rejectNote }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS ${name} ditolak (Rejected) dengan catatan: ${rejectNote}`);
        setSelectedSub(null);
        setRejectNote("");
        fetchSubmissions();
      } else {
        triggerToast(data.error || "Gagal menolak KRS");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const currentYear = new Date().getFullYear();

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f7f9] text-[#0f487b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#0f487b] rounded-full animate-spin"></div>
          <span className="font-bold text-sm tracking-wide">
            Memvalidasi sesi admin akademis...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Component */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        adminUser={adminUser}
        submissionsCount={submissions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Header Component */}
        <AdminHeader
          setIsSidebarOpen={setIsSidebarOpen}
          adminUser={adminUser}
          currentYear={currentYear}
        />

        {/* Scrollable Main Workspace */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {activeTab === "dashboard" && (
            <DashboardTab
              overviewData={overviewData}
              submissionsCount={submissions.length}
            />
          )}

          {activeTab === "prodi" && (
            <ProdiTab triggerToast={triggerToast} />
          )}

          {activeTab === "tahun_ajaran" && (
            <TahunAjaranTab
              setActiveModal={setActiveModal}
              setActiveTab={setActiveTab}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "periode" && (
            <PeriodeTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "kurikulum" && (
            <KurikulumTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "matakuliah" && (
            <MatakuliahTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "kelas" && (
            <KelasTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "jadwal" && (
            <JadwalTab
              setActiveTab={setActiveTab}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "nilai" && (
            <NilaiTab
              setActiveTab={setActiveTab}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "krs_validation" && (
            <KrsValidationTab
              submissions={submissions}
              selectedSub={selectedSub}
              setSelectedSub={setSelectedSub}
              rejectNote={rejectNote}
              setRejectNote={setRejectNote}
              handleKrsApprove={handleKrsApprove}
              handleKrsReject={handleKrsReject}
            />
          )}

          {activeTab === "mahasiswa" && (
            <MahasiswaTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "dosen" && (
            <DosenTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "persuratan" && (
            <PersuratanTab
              setActiveModal={setActiveModal}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "pddikti" && <PddiktiTab triggerToast={triggerToast} />}

          {activeTab === "audit" && <AuditLogsTab />}

          {activeTab === "laporan" && <LaporanTab triggerToast={triggerToast} />}

          {activeTab === "pengaturan" && (
            <PengaturanTab triggerToast={triggerToast} />
          )}
        </div>
      </main>

      {/* Modal Dialog Suite */}
      <AdminModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        modalForm={modalForm}
        setModalForm={setModalForm}
        triggerToast={triggerToast}
        fetchOverview={fetchOverview}
      />

      {/* TOAST Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[210] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
