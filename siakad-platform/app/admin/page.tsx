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

  // Modal State
  const [activeModal, setActiveModal] = useState<null | "tambah_ta" | "tambah_periode" | "tambah_kurikulum" | "tambah_mk" | "tambah_kelas" | "tambah_jadwal" | "tambah_mhs" | "tambah_dosen" | "tambah_surat">(null);
  const [modalForm, setModalForm] = useState<Record<string, string>>({});

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

          {/* TAB: TAHUN AJARAN */}
          {activeTab === "tahun_ajaran" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Master Tahun Ajaran</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola kalender dan rentang tahun akademik kampus.</p>
                </div>
                <button
                  onClick={() => setActiveModal("tambah_ta")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  + Tambah Tahun Ajaran
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Tahun Ajaran</th>
                      <th className="px-5 py-3.5">Kode TA</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Jumlah Semester</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">2026 / 2027</td>
                      <td className="px-5 py-4 font-mono font-semibold">2026</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4">2 (Ganjil & Genap)</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => triggerToast("Tahun ajaran 2026/2027 sedang aktif")}
                          className="text-[#0f487b] hover:underline font-bold"
                        >
                          Kelola →
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">2025 / 2026</td>
                      <td className="px-5 py-4 font-mono font-semibold">2025</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                          Selesai / Arsip
                        </span>
                      </td>
                      <td className="px-5 py-4">2 (Ganjil & Genap)</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => triggerToast("Melihat arsip 2025/2026")}
                          className="text-slate-500 hover:underline font-bold"
                        >
                          Arsip →
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PERIODE AKADEMIK */}
          {activeTab === "periode" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Periode Akademik Aktif</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Konfigurasi jadwal KRS, Perkuliahan, UTS & UAS.</p>
                </div>
                <button
                  onClick={() => triggerToast("Status periode akademik diperbarui.")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  ✓ Periode Berjalan (Ganjil 2026/2027)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durasi Perkuliahan</span>
                  <p className="text-lg font-bold text-slate-800">01 Sep 2026 – 28 Feb 2027</p>
                  <p className="text-xs text-emerald-600 font-bold">● Minggu ke-10 Berjalan</p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal UTS</span>
                  <p className="text-lg font-bold text-slate-800">27 Okt – 07 Nov 2026</p>
                  <p className="text-xs text-amber-600 font-bold">📌 Selesai (Nilai 92% masuk)</p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jadwal UAS</span>
                  <p className="text-lg font-bold text-slate-800">12 Jan – 23 Jan 2027</p>
                  <p className="text-xs text-slate-400 font-bold">⏳ Mendatang</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: KURIKULUM */}
          {activeTab === "kurikulum" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Manajemen Kurikulum Master</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar kurikulum resmi prodi dan pemetaan SKS.</p>
                </div>
                <button
                  onClick={() => setActiveModal("tambah_kurikulum")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  + Buat Kurikulum Baru
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Nama Kurikulum</th>
                      <th className="px-5 py-3.5">Program Studi</th>
                      <th className="px-5 py-3.5">Tahun Berlaku</th>
                      <th className="px-5 py-3.5">Total SKS</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">Kurikulum S1 Informatika 2024</td>
                      <td className="px-5 py-4">S1 Informatika (FTI)</td>
                      <td className="px-5 py-4 font-mono font-bold">2024</td>
                      <td className="px-5 py-4 font-bold">144 SKS</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => triggerToast("Membuka detail kurikulum S1 Informatika")}
                          className="text-[#0f487b] hover:underline font-bold"
                        >
                          Detail & MK →
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">Kurikulum S1 Sistem Informasi 2024</td>
                      <td className="px-5 py-4">S1 Sistem Informasi (FTI)</td>
                      <td className="px-5 py-4 font-mono font-bold">2024</td>
                      <td className="px-5 py-4 font-bold">144 SKS</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => triggerToast("Membuka detail kurikulum S1 Sistem Informasi")}
                          className="text-[#0f487b] hover:underline font-bold"
                        >
                          Detail & MK →
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MATA KULIAH */}
          {activeTab === "matakuliah" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Katalog Mata Kuliah</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar mata kuliah aktif seluruh program studi.</p>
                </div>
                <button
                  onClick={() => setActiveModal("tambah_mk")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  + Tambah Mata Kuliah Baru
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Kode</th>
                      <th className="px-5 py-3.5">Nama Mata Kuliah</th>
                      <th className="px-5 py-3.5">SKS</th>
                      <th className="px-5 py-3.5">Jenis</th>
                      <th className="px-5 py-3.5">Semester</th>
                      <th className="px-5 py-3.5">Mode Pembelajaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { code: "INF101", name: "Pemrograman Dasar", sks: 4, type: "Wajib Prodi", sem: 1, mode: "Async PJJ" },
                      { code: "INF102", name: "Kalkulus I", sks: 3, type: "Wajib Prodi", sem: 1, mode: "Async PJJ" },
                      { code: "INF201", name: "Algoritma Lanjut & Kompleksitas", sks: 4, type: "Wajib Prodi", sem: 3, mode: "Async PJJ" },
                      { code: "INF202", name: "Basis Data Terdistribusi", sks: 3, type: "Wajib Prodi", sem: 3, mode: "Async PJJ" },
                      { code: "INF203", name: "Kecerdasan Buatan", sks: 3, type: "Wajib Prodi", sem: 3, mode: "Async PJJ" },
                    ].map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono font-bold text-[#0f487b]">{item.code}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{item.name}</td>
                        <td className="px-5 py-4 font-bold">{item.sks} SKS</td>
                        <td className="px-5 py-4">{item.type}</td>
                        <td className="px-5 py-4 font-semibold">Semester {item.sem}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                            {item.mode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: KELAS KULIAH */}
          {activeTab === "kelas" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Kelas Kuliah Paralel</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar kelas perkuliahan aktif yang disinkronkan ke LMS.</p>
                </div>
                <button
                  onClick={() => triggerToast("Form buka kelas paralel dibuka.")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  + Buka Kelas Paralel
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Nama Kelas</th>
                      <th className="px-5 py-3.5">Mata Kuliah</th>
                      <th className="px-5 py-3.5">Dosen Pengampu</th>
                      <th className="px-5 py-3.5">Kapasitas</th>
                      <th className="px-5 py-3.5">Status Sync LMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: "Kelas A PJJ", course: "INF101 · Pemrograman Dasar", dosen: "Dr. Hendra Setiawan, M.Kom.", cap: "38 / 40", status: "Synced to LMS" },
                      { name: "Kelas A PJJ", course: "INF102 · Kalkulus I", dosen: "Dr. Hendra Setiawan, M.Kom.", cap: "40 / 40", status: "Synced to LMS" },
                      { name: "Kelas A PJJ", course: "INF201 · Algoritma Lanjut", dosen: "Dr. Hendra Setiawan, M.Kom.", cap: "35 / 40", status: "Synced to LMS" },
                    ].map((cls, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-bold text-slate-800">{cls.name}</td>
                        <td className="px-5 py-4 font-semibold text-[#0f487b]">{cls.course}</td>
                        <td className="px-5 py-4">{cls.dosen}</td>
                        <td className="px-5 py-4 font-mono font-bold">{cls.cap}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                            ● {cls.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: JADWAL & SESI */}
          {activeTab === "jadwal" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Jadwal & Sesi Pertemuan (1-16)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Matriks jadwal sesi reguler, UTS & UAS perkuliahan PJJ.</p>
                </div>
                <button
                  onClick={() => triggerToast("Jadwal sesi diperbarui dari LMS.")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🔄 Refresh Jadwal LMS
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Sesi</th>
                      <th className="px-5 py-3.5">Topik Pertemuan</th>
                      <th className="px-5 py-3.5">Tanggal & Waktu</th>
                      <th className="px-5 py-3.5">Tipe Sesi</th>
                      <th className="px-5 py-3.5">Virtual Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono font-bold">Sesi 1</td>
                      <td className="px-5 py-4 font-bold text-slate-800">Pengenalan Lingkungan Pemrograman & Logika Dasar</td>
                      <td className="px-5 py-4">07 Sep 2026 · 08:00 - 10:30</td>
                      <td className="px-5 py-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded">Reguler</span></td>
                      <td className="px-5 py-4 text-brand-600 font-mono text-[11px] font-bold">meet.jit.si/unsia-pjj</td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-amber-50/40">
                      <td className="px-5 py-4 font-mono font-bold text-amber-700">Sesi 8</td>
                      <td className="px-5 py-4 font-bold text-amber-900">Ujian Tengah Semester (UTS) Online</td>
                      <td className="px-5 py-4 text-amber-800 font-semibold">26 Okt 2026 · 08:00 - 10:30</td>
                      <td className="px-5 py-4"><span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded">UTS</span></td>
                      <td className="px-5 py-4 text-amber-700 font-mono text-[11px] font-bold">CBT System Online</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NILAI & KHS */}
          {activeTab === "nilai" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Rekapitulasi Nilai & KHS Mahasiswa</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Input nilai Tugas, Quiz, UTS, UAS & Konversi Bobot Nilai.</p>
                </div>
                <button
                  onClick={() => triggerToast("Rekapitulasi nilai KHS dikunci dan dipublikasikan.")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🔒 Lock & Publicate KHS
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">NIM</th>
                      <th className="px-5 py-3.5">Nama Mahasiswa</th>
                      <th className="px-5 py-3.5">Tugas (20%)</th>
                      <th className="px-5 py-3.5">Quiz (20%)</th>
                      <th className="px-5 py-3.5">UTS (30%)</th>
                      <th className="px-5 py-3.5">UAS (30%)</th>
                      <th className="px-5 py-3.5">Nilai Akhir</th>
                      <th className="px-5 py-3.5">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono font-bold text-[#0f487b]">26090182</td>
                      <td className="px-5 py-4 font-bold text-slate-800">Budi Santoso</td>
                      <td className="px-5 py-4 font-semibold">88.0</td>
                      <td className="px-5 py-4 font-semibold">85.0</td>
                      <td className="px-5 py-4 font-semibold">90.0</td>
                      <td className="px-5 py-4 font-semibold">87.0</td>
                      <td className="px-5 py-4 font-bold text-slate-900">87.7</td>
                      <td className="px-5 py-4 font-bold text-emerald-600">A (4.00)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DATA MAHASISWA */}
          {activeTab === "mahasiswa" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Data Master Mahasiswa</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar mahasiswa terdaftar di SIAKAD terintegrasi PMB.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerToast("Sinkronisasi data dari PMB berhasil.")}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    📥 Impor dari PMB
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">NIM</th>
                      <th className="px-5 py-3.5">Nama Lengkap</th>
                      <th className="px-5 py-3.5">Program Studi</th>
                      <th className="px-5 py-3.5">Angkatan</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Dosen PA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono font-bold text-[#0f487b]">26090182</td>
                      <td className="px-5 py-4 font-bold text-slate-800">Budi Santoso</td>
                      <td className="px-5 py-4">S1 Informatika (FTI)</td>
                      <td className="px-5 py-4 font-mono font-semibold">2026</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">Dr. Hendra Setiawan, M.Kom.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DOSEN & PENGAMPU */}
          {activeTab === "dosen" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Data Dosen & Pengampu</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar tenaga pengajar terintegrasi HRIS Platform.</p>
                </div>
                <button
                  onClick={() => triggerToast("Sinkronisasi data dosen dari HRIS berhasil.")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  🔄 Sinkron dari HRIS
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">NIDN</th>
                      <th className="px-5 py-3.5">Nama Dosen</th>
                      <th className="px-5 py-3.5">Homebase Prodi</th>
                      <th className="px-5 py-3.5">Jabatan Fungsional</th>
                      <th className="px-5 py-3.5">Status Pengampu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono font-bold text-[#0f487b]">0421098501</td>
                      <td className="px-5 py-4 font-bold text-slate-800">Dr. Hendra Setiawan, M.Kom.</td>
                      <td className="px-5 py-4">S1 Informatika (FTI)</td>
                      <td className="px-5 py-4 font-semibold">Lektor Kepala</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          Dosen Tetap
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PERSURATAN */}
          {activeTab === "persuratan" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Layanan Persuratan Akademik</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Pengajuan Surat Keterangan Aktif Kuliah & Rekomendasi.</p>
                </div>
                <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
                  7 Surat Pending
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">No. Pengajuan</th>
                      <th className="px-5 py-3.5">Pemohon (NIM / Nama)</th>
                      <th className="px-5 py-3.5">Jenis Surat</th>
                      <th className="px-5 py-3.5">Tanggal Pengajuan</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: "SRT-2026-001", mhs: "26090182 · Budi Santoso", type: "Surat Keterangan Aktif Kuliah", date: "28 Jul 2026", status: "Menunggu Approval BAAK" },
                    ].map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono font-bold text-[#0f487b]">{item.id}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{item.mhs}</td>
                        <td className="px-5 py-4 font-semibold">{item.type}</td>
                        <td className="px-5 py-4">{item.date}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => triggerToast(`Surat ${item.id} berhasil disetujui!`)}
                            className="px-3 py-1 bg-[#0f487b] text-white font-bold text-[10px] rounded-lg hover:bg-[#00719f]"
                          >
                            Setujui & Terbitkan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SINKRONISASI PDDIKTI */}
          {activeTab === "pddikti" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Sinkronisasi Feeder PDDikti v2.0</h2>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                <span className="text-4xl">☁️</span>
                <h3 className="font-bold text-slate-800">UNSIA Feeder Sync Agent</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sinkronisasikan data mahasiswa, krs, nilai semester & lulusan ke server PDDikti pusat secara otomatis.
                </p>
                <button
                  onClick={() => triggerToast("Proses sync PDDikti berhasil dijalankan di latar belakang!")}
                  className="px-6 py-2.5 bg-[#0f487b] text-white font-bold text-xs rounded-xl hover:bg-[#00719f] shadow-md"
                >
                  🚀 Jalankan Sync Feeder PDDikti Sekarang
                </button>
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Audit Logs Sistem Akademik</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Aktor</th>
                      <th className="px-5 py-3.5">Aksi / Operasi</th>
                      <th className="px-5 py-3.5">Platform Target</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">Admin BAAK (Bu Ratri)</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">Approve KRS Mahasiswa (26090182)</td>
                      <td className="px-5 py-4 font-mono font-bold">SIAKAD Platform</td>
                      <td className="px-5 py-4 text-slate-400 font-mono">Hari ini, 01:30:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LAPORAN */}
          {activeTab === "laporan" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Laporan & Analitik Akademik</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ringkasan laporan IPK, kelulusan, dan beban mengajar dosen.</p>
                </div>
                <button
                  onClick={() => triggerToast("Mengunduh Laporan Akademik (PDF/Excel)...")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  📥 Export Laporan PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Laporan Rata-rata IPK per Prodi</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold"><span>S1 Informatika</span><span className="text-emerald-600">3.52</span></div>
                    <div className="flex justify-between font-bold"><span>S1 Sistem Informasi</span><span className="text-emerald-600">3.48</span></div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Laporan Rasio Dosen : Mahasiswa</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold"><span>Total Dosen Aktif</span><span>152 Dosen</span></div>
                    <div className="flex justify-between font-bold"><span>Total Mahasiswa Aktif</span><span>3.719 Mahasiswa</span></div>
                    <div className="flex justify-between font-bold text-[#0f487b]"><span>Rasio Akademik</span><span>1 : 24.4 (Ideal)</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PENGATURAN */}
          {activeTab === "pengaturan" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Pengaturan Parameter Akademik</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Batas SKS maksimum, bobot evaluasi nilai & aturan KRS.</p>
                </div>
                <button
                  onClick={() => triggerToast("Pengaturan akademik berhasil disimpan.")}
                  className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  💾 Simpan Pengaturan
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Maksimum SKS untuk IPK {">"}= 3.00</label>
                    <input type="number" defaultValue={24} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Maksimum SKS untuk IPK {"<"} 3.00</label>
                    <input type="number" defaultValue={20} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* MODAL DIALOG OVERLAY */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base capitalize">
                {activeModal.replace("_", " ")}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerToast(`Data ${activeModal.replace("_", " ")} berhasil disimpan ke database!`);
                setActiveModal(null);
                setModalForm({});
              }}
              className="space-y-4 text-xs"
            >
              {activeModal === "tambah_ta" && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tahun Ajaran (YYYY/YYYY)</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: 2027/2028"
                      value={modalForm.ta || ""}
                      onChange={(e) => setModalForm({ ...modalForm, ta: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold focus:border-[#0f487b]"
                    />
                  </div>
                </>
              )}

              {activeModal === "tambah_periode" && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Periode</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Semester Genap 2026/2027"
                      value={modalForm.periode || ""}
                      onChange={(e) => setModalForm({ ...modalForm, periode: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold focus:border-[#0f487b]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        required
                        value={modalForm.startDate || ""}
                        onChange={(e) => setModalForm({ ...modalForm, startDate: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        required
                        value={modalForm.endDate || ""}
                        onChange={(e) => setModalForm({ ...modalForm, endDate: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModal === "tambah_kurikulum" && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Kurikulum</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Kurikulum S1 Informatika 2026"
                      value={modalForm.namaKurikulum || ""}
                      onChange={(e) => setModalForm({ ...modalForm, namaKurikulum: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tahun Berlaku</label>
                      <input
                        type="number"
                        defaultValue={2026}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Total Target SKS</label>
                      <input
                        type="number"
                        defaultValue={144}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModal === "tambah_mk" && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kode Mata Kuliah</label>
                    <input
                      type="text"
                      required
                      placeholder="INF301"
                      value={modalForm.kodeMk || ""}
                      onChange={(e) => setModalForm({ ...modalForm, kodeMk: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Mata Kuliah</label>
                    <input
                      type="text"
                      required
                      placeholder="Pemrograman Web Lanjut"
                      value={modalForm.namaMk || ""}
                      onChange={(e) => setModalForm({ ...modalForm, namaMk: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">SKS</label>
                      <input
                        type="number"
                        defaultValue={3}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dosen Koordinator</label>
                      <input
                        type="text"
                        placeholder="Dr. Hendra Setiawan, M.Kom."
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {(activeModal === "tambah_kelas" || activeModal === "tambah_jadwal" || activeModal === "tambah_mhs" || activeModal === "tambah_dosen" || activeModal === "tambah_surat") && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Keterangan / Nama Form</label>
                  <input
                    type="text"
                    required
                    placeholder="Lengkapi detail pengisian..."
                    value={modalForm.detail || ""}
                    onChange={(e) => setModalForm({ ...modalForm, detail: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
