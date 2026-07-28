"use client";

import React, { useState, useEffect } from "react";
import PmbSidebar, { AdminPanelType } from "./components/PmbSidebar";
import PmbHeader from "./components/PmbHeader";
import PmbModals from "./components/PmbModals";

// Panel Components
import DashboardPanel from "./components/panels/DashboardPanel";
import MonitoringPanel from "./components/panels/MonitoringPanel";
import PendaftarPanel from "./components/panels/PendaftarPanel";
import SeleksiPanel from "./components/panels/SeleksiPanel";
import VerifikasiPanel from "./components/panels/VerifikasiPanel";
import PembayaranPanel from "./components/panels/PembayaranPanel";
import KomunikasiPanel from "./components/panels/KomunikasiPanel";
import GelombangPanel from "./components/panels/GelombangPanel";
import MahasiswaPanel from "./components/panels/MahasiswaPanel";
import PengaturanPanel from "./components/panels/PengaturanPanel";

export interface ApplicantRow {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  currentStage: string;
  paymentStatus: "belum_bayar" | "lunas";
  createdAt: string;
  wave: string;
  entryPath: string;
  entryPathFee: string;
  studyProgram: string;
  docsCount: number;
  nim?: string;
  nimGeneratedAt?: string;
  totalExamScore?: string;
  passingRecommendation?: string;
}

export interface WaveRow {
  id: string;
  name: string;
  code: string;
  academicPeriodLabel?: string;
  defaultPassword?: string;
  startDate: string;
  endDate: string;
  status: "belum_dibuka" | "aktif" | "tertutup";
}

export default function PmbAdminDashboard() {
  const [activePanel, setActivePanel] = useState<AdminPanelType>("dashboard");
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [waves, setWaves] = useState<WaveRow[]>([]);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wave Modal Form States
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [waveForm, setWaveForm] = useState({
    name: "",
    code: "",
    academicPeriodLabel: "2026/2027 Ganjil",
    defaultPassword: "Pmb2026!",
    startDate: "",
    endDate: "",
    status: "belum_dibuka",
  });
  const [editingWaveId, setEditingWaveId] = useState<string | null>(null);
  const [isCreatingWave, setIsCreatingWave] = useState(false);

  // Filter States
  const [filterWave, setFilterWave] = useState("all");
  const [filterEntryPath, setFilterEntryPath] = useState("all");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/pmb-overview");
      const data = await res.json();
      if (data.success && data.data) {
        setApplicants(data.data.applicants || []);
        setWaves(data.data.waves || []);
        setQuotas(data.data.quotas || []);
      } else {
        setError(data.error || "Gagal mengambil data overview PMB");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waveForm.name || !waveForm.code || !waveForm.startDate || !waveForm.endDate) {
      triggerToast("Mohon lengkapi seluruh field gelombang!");
      return;
    }
    setIsCreatingWave(true);
    try {
      const isEdit = !!editingWaveId;
      const url = "/api/admin/gelombang";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit ? { id: editingWaveId, ...waveForm } : waveForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(isEdit ? "Gelombang berhasil diperbarui!" : "Gelombang baru berhasil ditambahkan!");
        setShowWaveModal(false);
        setEditingWaveId(null);
        setWaveForm({
          name: "",
          code: "",
          academicPeriodLabel: "2026/2027 Ganjil",
          defaultPassword: "Pmb2026!",
          startDate: "",
          endDate: "",
          status: "belum_dibuka",
        });
        fetchData();
      } else {
        triggerToast("Gagal menyimpan gelombang: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setIsCreatingWave(false);
    }
  };

  const handleToggleWaveStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/gelombang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Status gelombang diubah ke ${newStatus.replace("_", " ")}!`);
        fetchData();
      } else {
        triggerToast("Gagal mengubah status: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const handleSaveQuota = async (quotaId: string) => {
    try {
      const res = await fetch("/api/admin/quota", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quotaId, targetQuota: editingQuotaValue }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Kuota prodi berhasil diperbarui!");
        setEditingQuotaId(null);
        fetchData();
      } else {
        triggerToast("Gagal memperbarui kuota: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const handleExportToSiakad = async (applicantId: string) => {
    try {
      const res = await fetch("/api/export-to-siakad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`NIM ${data.nim} berhasil diterbitkan dan di-export ke SIAKAD!`);
        fetchData();
      } else {
        triggerToast("Gagal export ke SIAKAD: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const handleExportCsv = () => {
    if (applicants.length === 0) {
      triggerToast("Tidak ada data untuk diexport!");
      return;
    }
    const headers = ["No Reg", "Nama", "Email", "Telepon", "Tahap", "Status Bayar", "Gelombang", "Jalur", "Prodi", "NIM"];
    const rows = applicants.map((a) => [
      a.registrationNumber,
      `"${a.fullName}"`,
      a.email,
      a.phone,
      a.currentStage,
      a.paymentStatus,
      `"${a.wave}"`,
      `"${a.entryPath}"`,
      `"${a.studyProgram}"`,
      a.nim || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pmb_pendaftar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Data pendaftar berhasil diexport ke CSV!");
  };

  const activeWave = waves.find((w) => w.status === "aktif");
  const unverifiedDocsCount = applicants.filter((a) => a.docsCount > 0 && a.currentStage === "unggah_berkas").length;
  const acceptedCount = applicants.filter((a) => a.currentStage === "diterima" || a.nim).length;
  const totalFeesCollected = applicants.filter((a) => a.paymentStatus === "lunas").length * 350000;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-[#0f487b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent border-[#0f487b] rounded-full animate-spin"></div>
          <span className="font-bold text-xs">Memuat PMB Admin Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Component */}
      <PmbSidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        applicantsCount={applicants.length}
        unverifiedDocsCount={unverifiedDocsCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <PmbHeader activeWaveName={activeWave?.name} />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
              ⚠️ {error}
            </div>
          )}
          {activePanel === "dashboard" && (
            <DashboardPanel
              applicantsCount={applicants.length}
              unverifiedDocsCount={unverifiedDocsCount}
              acceptedCount={acceptedCount}
              totalFeesCollected={totalFeesCollected}
              triggerToast={triggerToast}
            />
          )}

          {activePanel === "monitoring" && (
            <MonitoringPanel applicants={applicants} waves={waves} />
          )}

          {activePanel === "pendaftar" && (
            <PendaftarPanel
              applicants={applicants}
              filterWave={filterWave}
              setFilterWave={setFilterWave}
              filterEntryPath={filterEntryPath}
              setFilterEntryPath={setFilterEntryPath}
              handleExportCsv={handleExportCsv}
              triggerToast={triggerToast}
            />
          )}

          {activePanel === "seleksi" && (
            <SeleksiPanel applicants={applicants} triggerToast={triggerToast} />
          )}

          {activePanel === "verifikasi" && (
            <VerifikasiPanel
              applicants={applicants}
              unverifiedDocsCount={unverifiedDocsCount}
              triggerToast={triggerToast}
            />
          )}

          {activePanel === "pembayaran" && (
            <PembayaranPanel applicants={applicants} triggerToast={triggerToast} />
          )}

          {activePanel === "komunikasi" && (
            <KomunikasiPanel triggerToast={triggerToast} />
          )}

          {activePanel === "gelombang" && (
            <GelombangPanel
              waves={waves}
              quotas={quotas}
              editingQuotaId={editingQuotaId}
              setEditingQuotaId={setEditingQuotaId}
              editingQuotaValue={editingQuotaValue}
              setEditingQuotaValue={setEditingQuotaValue}
              setShowWaveModal={setShowWaveModal}
              setEditingWaveId={setEditingWaveId}
              setWaveForm={setWaveForm}
              handleToggleWaveStatus={handleToggleWaveStatus}
              handleSaveQuota={handleSaveQuota}
            />
          )}

          {activePanel === "mahasiswa" && (
            <MahasiswaPanel
              acceptedApplicants={applicants.filter((a) => a.currentStage === "diterima" || a.nim)}
              handleExportToSiakad={handleExportToSiakad}
              triggerToast={triggerToast}
            />
          )}

          {activePanel === "pengaturan" && (
            <PengaturanPanel triggerToast={triggerToast} />
          )}
        </main>
      </div>

      {/* Modal Dialog Suite */}
      <PmbModals
        showWaveModal={showWaveModal}
        setShowWaveModal={setShowWaveModal}
        waveForm={waveForm}
        setWaveForm={setWaveForm}
        editingWaveId={editingWaveId}
        isCreatingWave={isCreatingWave}
        handleSaveWave={handleSaveWave}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
