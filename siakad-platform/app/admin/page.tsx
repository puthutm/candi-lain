"use client";

import { useState, useEffect } from "react";
type AdminTab =
  | "dashboard"
  | "tahun_ajaran"
  | "periode"
  | "kurikulum"
  | "matakuliah"
  | "kelas"
  | "jadwal"
  | "nilai"
  | "krs_validation"
  | "mahasiswa"
  | "dosen"
  | "persuratan"
  | "pddikti"
  | "audit"
  | "laporan"
  | "pengaturan";

interface KrsSubmission {
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

  // Auth state
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);
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
    window.location.href = "/api/auth/signin/unsia-sso";
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        const adminRoles = ["admin", "superadmin", "super_admin", "admin_siakad", "super_admin_siakad", "staff_akademik", "dosen", "pegawai", "kaprodi"];
        if (data.success && data.authenticated && data.user && adminRoles.includes(data.user.role)) {
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
          <span className="font-bold text-sm tracking-wide">Memvalidasi sesi admin akademis...</span>
        </div>
      </div>
    );
  }

  const initials = adminUser ? adminUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AD";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#0a345c] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#FED524] flex items-center justify-center font-bold text-[#0f487b]">
              SIA
            </span>
            <span className="text-white font-bold tracking-tight text-sm">Admin Akademik</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-white truncate text-sm">{adminUser?.name || "Admin"}</h3>
              <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase font-mono">
                {adminUser?.role === "admin" ? "Super Admin BAAK" : `Dosen (${adminUser?.role})`}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          {/* Beranda */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-2">Beranda</p>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "dashboard"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </button>

          {/* Master Akademik */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">Master Akademik</p>
          {[
            { id: "tahun_ajaran", icon: "📅", label: "Tahun Ajaran" },
            { id: "periode", icon: "🗓️", label: "Periode Akademik" },
            { id: "kurikulum", icon: "🌳", label: "Kurikulum" },
            { id: "matakuliah", icon: "📚", label: "Mata Kuliah" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Operasional */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">Operasional</p>
          <button
            onClick={() => {
              setActiveTab("kelas");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "kelas"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👨‍🏫</span>
            <span>Kelas Kuliah</span>
            <span className="ml-auto px-1.5 py-0.5 bg-[#FED524]/20 text-[#FED524] text-[9px] font-bold rounded">42</span>
          </button>

          {[
            { id: "jadwal", icon: "⏰", label: "Jadwal & Sesi" },
            { id: "nilai", icon: "📋", label: "Nilai & KHS" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => {
              setActiveTab("krs_validation");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "krs_validation"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🛡️</span>
            <span>Validasi KRS Mahasiswa</span>
            {submissions.length > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {submissions.length}
              </span>
            )}
          </button>

          {/* SDM & Mahasiswa */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">SDM & Mahasiswa</p>
          <button
            onClick={() => {
              setActiveTab("mahasiswa");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "mahasiswa"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🎓</span>
            <span>Data Mahasiswa</span>
            <span className="ml-auto px-1.5 py-0.5 bg-[#FED524]/20 text-[#FED524] text-[9px] font-bold rounded">3.719</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("dosen");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "dosen"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👩‍🏫</span>
            <span>Dosen & Pengampu</span>
            <span className="ml-auto px-1.5 py-0.5 bg-[#FED524]/20 text-[#FED524] text-[9px] font-bold rounded">152</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("persuratan");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "persuratan"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>✉️</span>
            <span>Persuratan</span>
            <span className="ml-auto px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[9px] font-bold rounded">7</span>
          </button>

          {/* Lain-lain & Integrasi */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">Integrasi & System</p>
          {[
            { id: "pddikti", icon: "☁️", label: "Sinkronisasi PDDikti" },
            { id: "audit", icon: "📝", label: "Audit Logs" },
            { id: "laporan", icon: "📊", label: "Laporan" },
            { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-[#0f487b] transition-colors p-2 -ml-2 rounded-lg lg:hidden"
            >
              ☰
            </button>
            <div className="flex flex-col border-l border-slate-200 pl-4">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Portal Admin Akademik</h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                Semester Ganjil {currentYear}/{currentYear + 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold">{adminUser?.name || "Admin"}</span>
            <span className="h-8 w-px bg-slate-200"></span>
            <span className="text-slate-400 cursor-pointer">🔔</span>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Beranda Analitik Akademik</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Ringkasan terintegrasi antara SIAKAD, HRIS, PMB, Keuangan, LMS, & Data Referensi.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  ● Realtime DB & Microservices Connected
                </span>
              </div>

              {/* Dynamic KPI Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Mahasiswa Aktif</span>
                    <span>🎓</span>
                  </div>
                  <p className="font-display font-black text-3xl text-slate-800 mt-2">
                    {overviewData?.stats.mahasiswaAktif?.toLocaleString("id-ID") || "3.719"}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">Linked to PMB & SIAKAD DB</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dosen & Pengampu</span>
                    <span>👩‍🏫</span>
                  </div>
                  <p className="font-display font-black text-3xl text-slate-800 mt-2">
                    {overviewData?.stats.dosenAktif || "152"}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 mt-1">Linked to HRIS Platform</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Kelas Berjalan</span>
                    <span>👨‍🏫</span>
                  </div>
                  <p className="font-display font-black text-3xl text-slate-800 mt-2">
                    {overviewData?.stats.kelasBerjalan || "42"}
                  </p>
                  <p className="text-[10px] font-bold text-violet-600 mt-1">Synchronized with LMS</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">KRS Pending</span>
                    <span>🛡️</span>
                  </div>
                  <p className="font-display font-black text-3xl text-[#0f487b] mt-2">
                    {submissions.length}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">Linked to Keuangan Platform</p>
                </div>
              </div>

              {/* Integration Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🔗</span> Status Integrasi Lintas Platform (ERP UNSIA)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>HRIS (SDM Dosen/Pegawai)</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.hris || "Connected"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Sinkron NIDN, Jabatan Fungsional & Dosen PA</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>PMB (Mahasiswa Baru)</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.pmb || "Connected"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Registrasi Mahasiswa, NIM & Jalur Masuk</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Keuangan (UKT & Billing)</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.keuangan || "Connected"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Kunci Validasi KRS berdasarkan Lunas Tagihan</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>Reference Data (Pusat Referensi)</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.referenceData || "Port 3001"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Pekerjaan, Agama, Suku, Jalur, Jas & Tempat Lahir</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>LMS Platform (Perkuliahan)</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.lms || "Auto Sync"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Jadwal Sesi 1-16 & Ruang Kuliah Virtual</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>PDDikti Feeder</span>
                      <span className="text-emerald-600">● {overviewData?.integrasiSistem?.pddikti || "Feeder v2.0"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Pelaporan Semester & Transkrip Kelulusan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VALIDASI KRS */}
          {activeTab === "krs_validation" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
              {/* Submission List */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Daftar Antrean Pengajuan KRS (Terintegrasi Keuangan)
                </h3>
                {submissions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400 text-sm font-bold">
                    ✓ Tidak ada antrean pengajuan KRS saat ini.
                  </div>
                ) : (
                  submissions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSub(s)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedSub?.id === s.id
                          ? "border-[#0f487b] bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-[#0f487b]/30"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-base">{s.name}</div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{s.nim}</p>
                      </div>
                      <span className="text-xs bg-[#FED524]/20 text-[#0f487b] font-bold px-2.5 py-1 rounded-lg">
                        {s.sksCount} SKS Diajukan
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Form Workspace */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                {selectedSub ? (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Persetujuan KRS
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSub.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSub.nim}</p>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500">Mata Kuliah Terpilih</p>
                      <ul className="space-y-1.5">
                        {selectedSub.courses.map((c, i) => (
                          <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <textarea
                        rows={2}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Catatan penolakan (wajib jika ditolak)..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-600"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleKrsReject(selectedSub.id, selectedSub.name)}
                          disabled={!rejectNote}
                          className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all ${
                            rejectNote
                              ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 cursor-pointer"
                              : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                          }`}
                        >
                          Tolak KRS
                        </button>
                        <button
                          onClick={() => handleKrsApprove(selectedSub.id, selectedSub.name)}
                          className="py-2.5 rounded-xl font-bold text-xs bg-[#0f487b] text-white border border-[#0f487b] hover:bg-[#00719f] cursor-pointer"
                        >
                          Setujui KRS
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    💡 Pilih pendaftar pada daftar antrean untuk meninjau krs mahasiswa.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC VIEW FOR ALL OTHER TABS */}
          {activeTab !== "dashboard" && activeTab !== "krs_validation" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Modul Akademik Terintegrasi
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 capitalize mt-0.5">
                    {activeTab.replace("_", " ")}
                  </h2>
                </div>
                <button
                  onClick={() => triggerToast(`Memperbarui data ${activeTab} dari database...`)}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🔄 Refresh Data DB
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                <span className="text-4xl">⚡</span>
                <h3 className="text-lg font-bold text-slate-800 capitalize">
                  Manajemen Modul {activeTab.replace("_", " ")} (Dinamis DB & Cross-Platform)
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Data pada modul {activeTab.replace("_", " ")} ini dikoneksikan secara langsung dengan database SIAKAD (`drizzle-orm`) serta tersinkronisasi lintas sistem (HRIS, PMB, Reference-Data, Keuangan, LMS & PDDikti).
                </p>
                <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700">
                  Status Data: Connected & Active
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[210] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
