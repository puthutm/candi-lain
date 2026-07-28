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
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs">📅</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Master · Tahun Ajaran
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Tahun Ajaran UNSIA</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Master tahun ajaran berformat <strong>YYYY/YYYY</strong> saja (misal 2026/2027). Setting Ganjil/Genap dan detail kalender akademik dikelola di menu <strong>Periode Akademik</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal("tambah_ta")}
                    className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    + Tambah Tahun Ajaran
                  </button>
                </div>
              </div>

              {/* Info Callout Box (Req #12) */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                <span className="text-blue-600 text-base font-bold shrink-0">ℹ️</span>
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Catatan Sesuai Aturan Kemenristekdikti:</strong> Tahun Ajaran hanya menyimpan format tahun saja (misal <strong>2026/2027</strong>). Pemecahan menjadi semester Ganjil & Genap dilakukan di menu <strong>Periode Akademik</strong> yang berisi tanggal kuliah, UTS, UAS, libur nasional, dan kalender aktivitas akademik per semester.
                </p>
              </div>

              {/* Card Grid Roster */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">TA 2026/2027</span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif Berjalan
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 font-display">2026 / 2027</h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
                    <p>• Periode Ganjil & Genap</p>
                    <p>• Total Mahasiswa: 3.719</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("periode")}
                    className="w-full mt-2 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Kelola Periode →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">TA 2025/2026</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                      Selesai
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 font-display">2025 / 2026</h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
                    <p>• Periode Ganjil & Genap</p>
                    <p>• Total Mahasiswa: 3.580</p>
                  </div>
                  <button
                    onClick={() => triggerToast("Melihat arsip TA 2025/2026")}
                    className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Lihat Arsip →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">TA 2024/2025</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                      Arsip
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 font-display">2024 / 2025</h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
                    <p>• Periode Ganjil & Genap</p>
                    <p>• Total Mahasiswa: 3.240</p>
                  </div>
                  <button
                    onClick={() => triggerToast("Melihat arsip TA 2024/2025")}
                    className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Lihat Arsip →
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">TA 2023/2024</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                      Arsip
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 font-display">2023 / 2024</h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
                    <p>• Periode Ganjil & Genap</p>
                  </div>
                  <button
                    onClick={() => triggerToast("Melihat arsip TA 2023/2024")}
                    className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Lihat Arsip →
                  </button>
                </div>
              </div>

              {/* Active Period Card */}
              <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 font-display">
                        Periode Ganjil 2026/2027 (P-2026-GANJIL)
                      </h3>
                      <p className="text-xs text-slate-500">01 Sep 2026 – 15 Feb 2027 (16 Sesi Pertemuan Wajib)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                    ● Periode Berjalan (Aktif)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masa Pengisian KRS</span>
                    <p className="font-bold text-slate-800 text-sm">15 Aug – 29 Aug 2026</p>
                    <p className="text-emerald-600 font-semibold">✓ Selesai Terverifikasi</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masa Perkuliahan</span>
                    <p className="font-bold text-slate-800 text-sm">01 Sep – 20 Des 2026</p>
                    <p className="text-emerald-600 font-semibold">● Minggu ke-10 Berjalan</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jadwal UTS</span>
                    <p className="font-bold text-slate-800 text-sm">27 Okt – 07 Nov 2026</p>
                    <p className="text-amber-600 font-semibold">📌 Nilai 92% Masuk</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jadwal UAS</span>
                    <p className="font-bold text-slate-800 text-sm">12 Jan – 23 Jan 2027</p>
                    <p className="text-slate-500 font-semibold">⏳ Mendatang</p>
                  </div>
                </div>

                {/* National Holidays & Academic Activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700 mb-2">🌴 Libur Nasional Periodik:</h4>
                    <ul className="space-y-1 text-slate-600 font-medium">
                      <li>• 17 Aug 2026 — Hari Kemerdekaan RI</li>
                      <li>• 10 Sep 2026 — Maulid Nabi Muhammad SAW</li>
                      <li>• 25 Des 2026 — Hari Raya Natal</li>
                      <li>• 01 Jan 2027 — Tahun Baru Masehi</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 mb-2">📌 Agenda Aktivitas Akademik:</h4>
                    <ul className="space-y-1 text-slate-600 font-medium">
                      <li>• Pendaftaran Maba Gelombang 1: 01–30 Jun 2026</li>
                      <li>• Daftar Ulang Mahasiswa: 15–29 Aug 2026</li>
                      <li>• Pengumuman Nilai Akhir KHS: 06 Feb 2027</li>
                      <li>• Yudisium Semester Ganjil: 10 Feb 2027</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Past Period Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display">
                      Periode Genap 2025/2026 (P-2025-GENAP)
                    </h3>
                    <p className="text-xs text-slate-500">16 Feb 2026 – 31 Aug 2026 (16 Sesi Pertemuan)</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
                    Selesai / Terarsip
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Total Mahasiswa Terdaftar: 3.580 Mahasiswa</span>
                  <button
                    onClick={() => triggerToast("Melihat detail arsip Periode Genap 2025/2026")}
                    className="text-[#0f487b] hover:underline font-bold"
                  >
                    Detail Kalender & Hasil →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: KURIKULUM */}
          {activeTab === "kurikulum" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs">🌳</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Master · Kurikulum Prodi
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Kurikulum Program Studi</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Master kurikulum resmi per program studi. Setiap kurikulum berisi daftar mata kuliah wajib & pilihan beserta struktur SKS dan distribusi semester.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal("tambah_kurikulum")}
                    className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    + Tambah Kurikulum
                  </button>
                </div>
              </div>

              {/* 2x4 Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. S1 IF */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Informatika 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">42 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Informatika")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 56 Mata Kuliah →
                  </button>
                </div>

                {/* 2. S1 SI */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Sistem Informasi 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">40 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Sistem Informasi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 54 Mata Kuliah →
                  </button>
                </div>

                {/* 3. S1 MJ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Manajemen 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">38 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Manajemen")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 52 Mata Kuliah →
                  </button>
                </div>

                {/* 4. S1 AK */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Akuntansi 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">38 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Akuntansi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 52 Mata Kuliah →
                  </button>
                </div>

                {/* 5. S1 Psikologi */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">PSI · KUR-2024</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Psikologi 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">144</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">36 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK Kurikulum S1 Psikologi")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 50 Mata Kuliah →
                  </button>
                </div>

                {/* 6. S2 MM */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FEB · KUR-2024 (Pasca)</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S2 Magister Manajemen 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">42</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">10 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">4 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK S2 Magister Manajemen")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 14 Mata Kuliah →
                  </button>
                </div>

                {/* 7. S2 MIK */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">FTI · KUR-2024 (Pasca)</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S2 Magister Ilmu Komputer 2024</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Aktif
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">42</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-emerald-700 text-sm">10 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-violet-700 text-sm">4 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka katalog MK S2 Magister Ilmu Komputer")} className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 14 Mata Kuliah →
                  </button>
                </div>

                {/* 8. S1 IF 2020 Phase Out */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 opacity-80">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FTI · KUR-2020</span>
                      <h3 className="text-base font-bold text-slate-800">Kurikulum S1 Informatika 2020</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                      Phase-Out
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">TOTAL SKS</span><span className="font-bold text-slate-800 text-sm">146</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK WAJIB</span><span className="font-bold text-slate-700 text-sm">44 MK</span></div>
                    <div className="p-2 bg-slate-50 rounded-xl"><span className="text-slate-400 block text-[10px]">MK PILIHAN</span><span className="font-bold text-slate-700 text-sm">14 MK</span></div>
                  </div>
                  <button onClick={() => triggerToast("Membuka arsip Kurikulum S1 Informatika 2020")} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150">
                    Lihat 58 Mata Kuliah →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MATA KULIAH */}
          {activeTab === "matakuliah" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#FED524]">
                        Master Akademik
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Mata Kuliah UNSIA</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Master mata kuliah seluruh prodi. Setiap MK memiliki <strong>Dosen Koordinator</strong> yang bertanggung jawab atas substansi kurikulum dan koordinasi kelas paralel.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal("tambah_mk")}
                    className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    + Tambah Mata Kuliah
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="🔍 Cari kode atau nama MK..."
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
                  />
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Program Studi</option>
                    <option value="IF">S1 Informatika</option>
                    <option value="SI">S1 Sistem Informasi</option>
                    <option value="MJ">S1 Manajemen</option>
                    <option value="AK">S1 Akuntansi</option>
                    <option value="PSI">S1 Psikologi</option>
                  </select>
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Jenis (Wajib/Pilihan)</option>
                    <option value="Wajib">Wajib Prodi</option>
                    <option value="Pilihan">Pilihan</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Katalog Mata Kuliah Active</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">11 Mata Kuliah Ditampilkan</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Kode</th>
                        <th className="px-4 py-3">Nama Mata Kuliah</th>
                        <th className="px-4 py-3 text-center">SKS</th>
                        <th className="px-4 py-3 text-center">Smt</th>
                        <th className="px-4 py-3">Prodi</th>
                        <th className="px-4 py-3">Dosen Koordinator</th>
                        <th className="px-4 py-3 text-center">Kelas Paralel</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { code: "IF201", name: "Algoritma & Struktur Data", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                        { code: "IF203", name: "Pemrograman Berorientasi Objek", sks: 4, smt: 2, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                        { code: "IF205", name: "Basis Data", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                        { code: "IF207", name: "Jaringan Komputer", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "2 Kelas (58 Mhs)", type: "Wajib" },
                        { code: "MK101", name: "Pendidikan Pancasila", sks: 2, smt: 1, prodi: "Universal MKWU", dosen: "Bp. Surya Hartanto", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
                        { code: "MK103", name: "Bahasa Inggris", sks: 2, smt: 1, prodi: "Universal MKWU", dosen: "Ms. Diana Kartika", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
                        { code: "MK105", name: "Kewirausahaan", sks: 2, smt: 3, prodi: "Universal MKWU", dosen: "Dr. Rini Susilowati", kelas: "5 Kelas (280 Mhs)", type: "Wajib" },
                        { code: "IF209", name: "Pemrograman Web", sks: 4, smt: 3, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (85 Mhs)", type: "Wajib" },
                        { code: "IF301", name: "Rekayasa Perangkat Lunak", sks: 3, smt: 4, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "2 Kelas (76 Mhs)", type: "Wajib" },
                        { code: "IF401", name: "AI & Machine Learning", sks: 3, smt: 5, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "1 Kelas (32 Mhs)", type: "Pilihan" },
                        { code: "SI201", name: "Manajemen Proyek SI", sks: 3, smt: 2, prodi: "S1 Sistem Informasi", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "2 Kelas (64 Mhs)", type: "Wajib" },
                      ].map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{item.code}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.name}
                            <span className="block text-[10px] font-normal text-slate-400">{item.type}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{item.sks}</td>
                          <td className="px-4 py-3 text-center font-semibold">{item.smt}</td>
                          <td className="px-4 py-3">{item.prodi}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{item.dosen}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full">
                              {item.kelas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => triggerToast(`Detail mata kuliah ${item.name} (${item.code})`)}
                              className="text-[#0f487b] hover:underline font-bold"
                            >
                              Edit / Detail →
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

          {/* TAB: KELAS KULIAH */}
          {activeTab === "kelas" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Operasional
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Kelas Kuliah · Periode 2026/2027 Ganjil</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      42 kelas aktif berjalan. Klik baris untuk detail kelas (mahasiswa terdaftar, nilai, & absensi). Tombol <strong>Buka Kelas Paralel</strong> untuk menambah kelas pengulangan otomatis dari MK yang sudah ada.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 KPI Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Kelas</span>
                  <p className="font-display font-black text-2xl text-slate-800">42</p>
                  <p className="text-[10px] text-slate-500 font-bold">22 program studi</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Kelas Aktif</span>
                  <p className="font-display font-black text-2xl text-emerald-700">38</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Quota terisi {">"} 80%</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-violet-700 uppercase font-bold tracking-wider">Kelas Paralel</span>
                  <p className="font-display font-black text-2xl text-violet-700">12</p>
                  <p className="text-[10px] text-violet-600 font-bold">3 MK dengan ≥2 kelas</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Kelas Online</span>
                  <p className="font-display font-black text-2xl text-amber-700">14</p>
                  <p className="text-[10px] text-amber-600 font-bold">Zoom + LMS</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Kelas Perkuliahan Berjalan</h3>
                  <button
                    onClick={() => setActiveModal("tambah_kelas")}
                    className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    + Buka Kelas Paralel
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">ID Kelas</th>
                        <th className="px-4 py-3">Mata Kuliah</th>
                        <th className="px-4 py-3">Dosen Pengajar</th>
                        <th className="px-4 py-3">Jadwal Hari & Jam</th>
                        <th className="px-4 py-3">Ruang</th>
                        <th className="px-4 py-3 text-center">Kuota</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: "KLS-IF201-A", mk: "IF201 · Algoritma & Struktur Data (Kelas A)", dosen: "Dr. Aulia Rahman, M.Kom.", jadwal: "Senin, 08:00-11:00", ruang: "Lab Komputer 1", kuota: "32 / 35", status: "Aktif (Synced LMS)" },
                        { id: "KLS-IF201-B", mk: "IF201 · Algoritma & Struktur Data (Kelas B)", dosen: "Bp. Yusuf Andi, S.Kom., M.T.", jadwal: "Selasa, 13:00-16:00", ruang: "Lab Komputer 1", kuota: "30 / 35", status: "Paralel (Kelas A)" },
                        { id: "KLS-IF201-C", mk: "IF201 · Algoritma & Struktur Data (Kelas C)", dosen: "Noviandri, S.Kom., MMSI.", jadwal: "Rabu, 19:00-22:00", ruang: "Online (Zoom)", kuota: "25 / 35", status: "Paralel (Kelas A)" },
                        { id: "KLS-IF203-A", mk: "IF203 · Pemrograman Berorientasi Objek (Kelas A)", dosen: "Noviandri, S.Kom., MMSI.", jadwal: "Senin, 13:00-17:00", ruang: "Lab Komputer 2", kuota: "33 / 35", status: "Aktif (Synced LMS)" },
                        { id: "KLS-IF205-A", mk: "IF205 · Basis Data (Kelas A)", dosen: "Dr. Bayu Setiawan, M.T.", jadwal: "Selasa, 08:00-11:00", ruang: "Lab Basis Data", kuota: "31 / 35", status: "Aktif (Synced LMS)" },
                        { id: "KLS-IF207-A", mk: "IF207 · Jaringan Komputer (Kelas A)", dosen: "Prof. Dr. Hendro Wijaksono", jadwal: "Kamis, 13:00-16:00", ruang: "Lab Jaringan", kuota: "28 / 30", status: "Aktif (Synced LMS)" },
                        { id: "KLS-MK101-A", mk: "MK101 · Pendidikan Pancasila (Kelas A)", dosen: "Bp. Surya Hartanto", jadwal: "Jumat, 08:00-10:00", ruang: "R201", kuota: "48 / 50", status: "Aktif (Synced LMS)" },
                        { id: "KLS-MK103-A", mk: "MK103 · Bahasa Inggris (Kelas A)", dosen: "Ms. Diana Kartika", jadwal: "Sabtu, 08:00-10:00", ruang: "Online", kuota: "47 / 50", status: "Aktif (Synced LMS)" },
                      ].map((cls) => (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{cls.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{cls.mk}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{cls.dosen}</td>
                          <td className="px-4 py-3 font-semibold">{cls.jadwal}</td>
                          <td className="px-4 py-3">{cls.ruang}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{cls.kuota}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                              ● {cls.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => triggerToast(`Membuka workspace detail ${cls.id}`)}
                              className="text-[#0f487b] hover:underline font-bold"
                            >
                              Detail & Peserta →
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

          {/* TAB: JADWAL & SESI */}
          {activeTab === "jadwal" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Operasional
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Jadwal & Sesi Perkuliahan</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Tanggal mulai & durasi perkuliahan <strong>otomatis ditarik dari setting Periode Akademik aktif</strong>. Penyusunan jadwal mengikuti 5 tahap sequential.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Sequential Steps Progress Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>📋</span> 5 Tahap Sequential Penyusunan Jadwal Perkuliahan
                </h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
                  <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 1. Inventarisasi MK</button>
                  <span className="text-slate-400 font-mono">→</span>
                  <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 2. Alokasi Dosen</button>
                  <span className="text-slate-400 font-mono">→</span>
                  <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 3. Alokasi Ruang</button>
                  <span className="text-slate-400 font-mono">→</span>
                  <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 4. Slot Waktu</button>
                  <span className="text-slate-400 font-mono">→</span>
                  <button className="px-3 py-2 rounded-xl bg-[#0f487b] text-white shrink-0 shadow-md">⏱ 5. Set Tanggal Mulai (Auto-fill)</button>
                </div>
              </div>

              {/* Auto-fill Info Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                <span className="text-emerald-600 text-xl shrink-0">✓</span>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-emerald-900">Auto-fill dari Periode Akademik Aktif (Ganjil 2026/2027)</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Tanggal sesi 1 hingga sesi 16 di bawah ini otomatis terisi dari setting <strong>Periode Akademik · TA 2026/2027 Ganjil</strong>. Perubahan tanggal pada periode akan otomatis re-sync ke seluruh kelas & LMS.
                  </p>
                  <button
                    onClick={() => setActiveTab("periode")}
                    className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    ✏️ Edit Periode Akademik
                  </button>
                </div>
              </div>

              {/* Table Sesi 1 - 16 */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Matriks Matakuliah & Jadwal Sesi Pertemuan (1-16)</h3>
                  <button
                    onClick={() => triggerToast("Jadwal sesi disinkronkan ke LMS")}
                    className="px-3 py-1 bg-[#0f487b] text-white text-xs font-bold rounded-lg"
                  >
                    🔄 Re-sync LMS
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Sesi</th>
                        <th className="px-5 py-3">Topik & Aktivitas Pertemuan</th>
                        <th className="px-5 py-3">Tanggal & Jam</th>
                        <th className="px-5 py-3 text-center">Tipe Sesi</th>
                        <th className="px-5 py-3">Virtual Room URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 1</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">Pengenalan Lingkungan Pemrograman & Logika Dasar</td>
                        <td className="px-5 py-3.5">07 Sep 2026 · 08:00 - 10:30</td>
                        <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">Reguler</span></td>
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">meet.jit.si/unsia-pjj-sesi1</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 2</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">Variabel, Tipe Data, & Alur Kontrol Percabangan</td>
                        <td className="px-5 py-3.5">14 Sep 2026 · 08:00 - 10:30</td>
                        <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">Reguler</span></td>
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">meet.jit.si/unsia-pjj-sesi2</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-amber-50/40">
                        <td className="px-5 py-3.5 font-mono font-bold text-amber-700">Sesi 8</td>
                        <td className="px-5 py-3.5 font-bold text-amber-900">Ujian Tengah Semester (UTS) Online</td>
                        <td className="px-5 py-3.5 text-amber-800 font-semibold">26 Okt 2026 · 08:00 - 10:30</td>
                        <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded-full">UTS Online</span></td>
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-amber-700">CBT Exam Room Portal</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-rose-50/40">
                        <td className="px-5 py-3.5 font-mono font-bold text-rose-700">Sesi 16</td>
                        <td className="px-5 py-3.5 font-bold text-rose-900">Ujian Akhir Semester (UAS) Online & Project Submission</td>
                        <td className="px-5 py-3.5 text-rose-800 font-semibold">18 Jan 2027 · 08:00 - 10:30</td>
                        <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-bold text-[10px] rounded-full">UAS Online</span></td>
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-rose-700">CBT Final Exam Portal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NILAI & KHS */}
          {activeTab === "nilai" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Operasional
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Nilai & KHS Mahasiswa</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Manajemen input nilai per kelas dan generate KHS per mahasiswa. <strong>14 dosen belum input nilai UAS</strong> — gunakan tombol "Ingatkan" untuk kirim notifikasi otomatis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bobot Warning Banner (Req #6) */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-amber-600 text-lg">⚠️</span>
                  <div>
                    <span className="font-bold block">Bobot Evaluasi Nilai Aktif:</span>
                    <span className="text-slate-600">Tugas: 20% | Kuis: 10% | UTS: 30% | UAS: 40% (Total: 100%)</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("pengaturan")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px]"
                >
                  Ubah Bobot di Pengaturan →
                </button>
              </div>

              {/* 4 KPI Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kelas dengan Nilai</span>
                  <p className="font-display font-black text-2xl text-slate-800">28<span className="text-sm font-normal text-slate-400">/42</span></p>
                  <p className="text-[10px] text-emerald-600 font-bold">67% selesai input</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Pending Nilai</span>
                  <p className="font-display font-black text-2xl text-amber-700">14</p>
                  <p className="text-[10px] text-amber-600 font-bold">Deadline 25 Mei</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Rata-rata Nilai</span>
                  <p className="font-display font-black text-2xl text-emerald-700">78,5</p>
                  <p className="text-[10px] text-emerald-600 font-bold">B+ rata-rata kelas</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">Mahasiswa Tidak Lulus</span>
                  <p className="font-display font-black text-2xl text-rose-700">23</p>
                  <p className="text-[10px] text-rose-600 font-bold">Mengulang smt depan</p>
                </div>
              </div>

              {/* Table Status Input Nilai per Kelas */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Status Input Nilai per Kelas (Periode Ganjil 2026/2027)</h3>
                  <button
                    onClick={() => triggerToast("Reminder dikirim ke 14 dosen via Email & WA Bot!")}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    🔔 Ingatkan Semua (14 Dosen)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Kelas Kuliah</th>
                        <th className="px-4 py-3">Dosen Pengampu</th>
                        <th className="px-4 py-3 text-center">Jumlah Mhs</th>
                        <th className="px-4 py-3 text-center">Progress Input</th>
                        <th className="px-4 py-3 text-center">Deadline</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: "KLS-IF201-A", mk: "IF201 · Algoritma & Struktur Data (A)", dosen: "Dr. Aulia Rahman, M.Kom.", mhs: 32, progress: "4/4 (Tugas/Kuis/UTS/UAS)", deadline: "25 Mei 2026", status: "Lengkap", locked: true },
                        { id: "KLS-IF203-A", mk: "IF203 · Pemrograman Berorientasi Objek (A)", dosen: "Noviandri, S.Kom., MMSI.", mhs: 33, progress: "4/4 (Tugas/Kuis/UTS/UAS)", deadline: "25 Mei 2026", status: "Lengkap", locked: true },
                        { id: "KLS-IF205-A", mk: "IF205 · Basis Data (A)", dosen: "Dr. Bayu Setiawan, M.T.", mhs: 31, progress: "3/4 (Kurang UAS)", deadline: "25 Mei 2026", status: "Pending UAS", locked: false },
                        { id: "KLS-IF207-A", mk: "IF207 · Jaringan Komputer (A)", dosen: "Prof. Dr. Hendro Wijaksono", mhs: 28, progress: "2/4 (Kurang UTS & UAS)", deadline: "25 Mei 2026", status: "Pending UTS", locked: false },
                      ].map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {row.mk}
                            <span className="block text-[10px] font-mono text-[#0f487b]">{row.id}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">{row.dosen}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{row.mhs}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">{row.progress}</td>
                          <td className="px-4 py-3 text-center">{row.deadline}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${row.locked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {row.locked ? (
                              <button
                                onClick={() => triggerToast(`KHS kelas ${row.id} telah dikunci dan dipublikasikan!`)}
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                🔒 KHS Publicated
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerToast(`Reminder terkirim ke ${row.dosen}`)}
                                className="text-amber-700 font-bold hover:underline"
                              >
                                🔔 Ingatkan Dosen
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATA MAHASISWA */}
          {activeTab === "mahasiswa" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        SDM & Mahasiswa
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Data Mahasiswa UNSIA</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      3.719 mahasiswa aktif terdaftar. Klik baris untuk profil akademik lengkap, atau klik <strong>Edit Data</strong> untuk modifikasi biodata, wali, prodi, dan status registrasi.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerToast("Bulk export 3.719 mahasiswa sebagai XLSX berhasil!")}
                      className="px-3.5 py-2 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      📊 Export XLSX
                    </button>
                    <button
                      onClick={() => setActiveModal("tambah_mhs")}
                      className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Tambah Mahasiswa
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="🔍 Cari NIM atau nama mahasiswa..."
                    className="md:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
                  />
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Prodi</option>
                    <option value="IF">S1 Informatika</option>
                    <option value="SI">S1 Sistem Informasi</option>
                    <option value="MJ">S1 Manajemen</option>
                    <option value="AK">S1 Akuntansi</option>
                  </select>
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti Lapor">Cuti Lapor</option>
                    <option value="Cuti Tidak Lapor">Cuti Tidak Lapor</option>
                  </select>
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Jenis</option>
                    <option value="Reguler">Reguler</option>
                    <option value="Alih Jenjang">Alih Jenjang</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Mahasiswa (Sampel Roster Aktif)</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">3.719 Mahasiswa Terdaftar</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">NIM</th>
                        <th className="px-4 py-3">Nama Mahasiswa</th>
                        <th className="px-4 py-3">Prodi · Angkatan</th>
                        <th className="px-4 py-3 text-center">Smt</th>
                        <th className="px-4 py-3 text-center">IPK</th>
                        <th className="px-4 py-3">Jenis</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { nim: "26090182", nama: "Budi Santoso", prodi: "S1 Informatika · 2026", smt: 1, ipk: "3.85", jenis: "Reguler", status: "Aktif" },
                        { nim: "26090183", nama: "Siti Aminah", prodi: "S1 Sistem Informasi · 2026", smt: 1, ipk: "3.90", jenis: "Reguler", status: "Aktif" },
                        { nim: "25090110", nama: "Ahmad Fauzi", prodi: "S1 Informatika · 2025", smt: 3, ipk: "3.42", jenis: "Alih Jenjang", status: "Cuti Lapor" },
                        { nim: "24090099", nama: "Dewi Lestari", prodi: "S1 Manajemen · 2024", smt: 5, ipk: "3.75", jenis: "Reguler", status: "Aktif" },
                      ].map((mhs) => (
                        <tr key={mhs.nim} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{mhs.nim}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{mhs.nama}</td>
                          <td className="px-4 py-3">{mhs.prodi}</td>
                          <td className="px-4 py-3 text-center font-bold">{mhs.smt}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">{mhs.ipk}</td>
                          <td className="px-4 py-3">{mhs.jenis}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${mhs.status === "Aktif" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {mhs.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => triggerToast(`Mengedit data mahasiswa ${mhs.nama} (${mhs.nim})`)}
                              className="text-[#0f487b] font-bold hover:underline"
                            >
                              ✏️ Edit Data
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

          {/* TAB: DOSEN & PENGAMPU */}
          {activeTab === "dosen" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        SDM Akademik
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Dosen & Pengampu UNSIA</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Data dosen <strong>synced & read-only</strong> dari modul HRIS. Total 98 Dosen Tetap + 54 Dosen LB. Cek beban mengajar SKS dan penugasan MK Koordinator.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerToast("Membuka Portal SDM / HRIS Platform...")}
                      className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ↗ Buka HRIS
                    </button>
                    <button
                      onClick={() => setActiveModal("tambah_dosen")}
                      className="px-3.5 py-2 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      + Tambah Dosen
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="🔍 Cari NIP / NIDN atau nama dosen..."
                    className="md:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
                  />
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Jenis Dosen</option>
                    <option value="Dosen Tetap">Dosen Tetap</option>
                    <option value="Dosen LB">Dosen LB</option>
                  </select>
                  <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                    <option value="">Semua Fakultas</option>
                    <option value="FTI">Fakultas Teknologi Informasi</option>
                    <option value="FEB">Fakultas Ekonomi & Bisnis</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Roster Dosen & Tenaga Pengajar</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">152 Dosen Terdaftar</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">NIP / NIDN</th>
                        <th className="px-4 py-3">Nama & Gelar</th>
                        <th className="px-4 py-3">Fakultas · Homebase</th>
                        <th className="px-4 py-3">MK Koordinator</th>
                        <th className="px-4 py-3 text-center">Beban (Jam/Mgg)</th>
                        <th className="px-4 py-3">Jabatan Fungsional</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { nip: "0421098501", nama: "Dr. Aulia Rahman, M.Kom.", prodi: "FTI · S1 Informatika", mk: "Algoritma & Struktur Data", beban: "12 Jam", fungsional: "Lektor Kepala", status: "Dosen Tetap" },
                        { nip: "0415088203", nama: "Noviandri, S.Kom., MMSI.", prodi: "FTI · S1 Informatika", mk: "Pemrograman Web", beban: "14 Jam", fungsional: "Lektor", status: "Dosen Tetap" },
                        { nip: "0408127902", nama: "Dr. Bayu Setiawan, M.T.", prodi: "FTI · S1 Sistem Informasi", mk: "Basis Data", beban: "10 Jam", fungsional: "Lektor Kepala", status: "Dosen Tetap" },
                        { nip: "0401017001", nama: "Prof. Dr. Hendro Wijaksono", prodi: "FTI · S1 Informatika", mk: "Jaringan Komputer", beban: "8 Jam", fungsional: "Guru Besar", status: "Dosen Tetap" },
                      ].map((dsn) => (
                        <tr key={dsn.nip} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{dsn.nip}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{dsn.nama}</td>
                          <td className="px-4 py-3">{dsn.prodi}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{dsn.mk}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">{dsn.beban}</td>
                          <td className="px-4 py-3">{dsn.fungsional}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                              {dsn.status}
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

          {/* TAB: PERSURATAN */}
          {activeTab === "persuratan" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                        Layanan Akademik
                      </span>
                    </div>
                    <h2 className="font-display font-black text-2xl">Persuratan Akademik</h2>
                    <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                      Request surat: aktif kuliah, cuti, rekomendasi, transkrip, & pengantar penelitian. <strong>7 surat menunggu proses</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal("tambah_surat")}
                    className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    + Buat Surat Baru
                  </button>
                </div>
              </div>

              {/* 4 Service KPI Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Bulan Ini</span>
                  <p className="font-display font-black text-2xl text-slate-800">42</p>
                  <p className="text-[10px] text-emerald-600 font-bold">+8 vs bulan lalu</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Diproses</span>
                  <p className="font-display font-black text-2xl text-amber-700">7</p>
                  <p className="text-[10px] text-amber-600 font-bold">SLA avg 2.4 hari</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Menunggu TTD</span>
                  <p className="font-display font-black text-2xl text-blue-700">2</p>
                  <p className="text-[10px] text-blue-600 font-bold">Kabid BAAK</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Selesai</span>
                  <p className="font-display font-black text-2xl text-emerald-700">33</p>
                  <p className="text-[10px] text-emerald-600 font-bold">100% terkirim email</p>
                </div>
              </div>

              {/* Template Surat Grid (6 Cards) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>📄</span> Template Surat Resmi Tersedia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <button onClick={() => triggerToast("Membuat Surat Keterangan Aktif Kuliah...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    📜 Surat Aktif Kuliah
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">PDF Auto Generate with QR Code</span>
                  </button>
                  <button onClick={() => triggerToast("Membuat Surat Izin Cuti Akademik...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    ⏸️ Surat Cuti Akademik
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Persetujuan Kaprodi & Dekan</span>
                  </button>
                  <button onClick={() => triggerToast("Membuat Surat Pengantar Penelitian...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    🔬 Surat Pengantar Penelitian
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tujuan Perusahaan / Instansi</span>
                  </button>
                  <button onClick={() => triggerToast("Membuat Surat Rekomendasi Beasiswa...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    🌟 Rekomendasi Beasiswa
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tanda Tangan Dekan / WD 1</span>
                  </button>
                  <button onClick={() => triggerToast("Membuat Transkrip Nilai Sementara...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    📊 Transkrip Sementara
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Legalisir Digital Stempel BAAK</span>
                  </button>
                  <button onClick={() => triggerToast("Membuat Surat Bebas Pustaka...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition">
                    📚 Bebas Pustaka
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Integrasi Perpustakaan UNSIA</span>
                  </button>
                </div>
              </div>

              {/* Data Table Request Surat */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Antrean Request Surat Akademik</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">7 Pengajuan Menunggu</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">ID Surat</th>
                        <th className="px-4 py-3">Jenis Surat</th>
                        <th className="px-4 py-3">Pemohon (Mhs)</th>
                        <th className="px-4 py-3">Tujuan Penggunaan</th>
                        <th className="px-4 py-3">Tanggal Request</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: "SRT-2026-001", type: "Surat Aktif Kuliah", mhs: "26090182 · Budi Santoso", goal: "Syarat BPJS TK Orangtua", date: "28 Jul 2026", status: "Diproses BAAK" },
                        { id: "SRT-2026-002", type: "Rekomendasi Beasiswa", mhs: "26090183 · Siti Aminah", goal: "Beasiswa Djarum 2026", date: "27 Jul 2026", status: "Menunggu TTD Dekan" },
                        { id: "SRT-2026-003", type: "Pengantar Penelitian", mhs: "25090110 · Ahmad Fauzi", goal: "PT Telkom Indonesia", date: "26 Jul 2026", status: "Selesai (Terkirim)" },
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{item.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{item.type}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{item.mhs}</td>
                          <td className="px-4 py-3">{item.goal}</td>
                          <td className="px-4 py-3 font-mono">{item.date}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${item.status.includes("Selesai") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => triggerToast(`Memproses & Menerbitkan ${item.id}`)}
                              className="text-[#0f487b] font-bold hover:underline"
                            >
                              Proses Surat →
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
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              {/* Gradient Banner */}
              <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                      Analitik & Reporting
                    </span>
                  </div>
                  <h2 className="font-display font-black text-2xl">Laporan Akademik Master</h2>
                  <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                    Laporan periodik dan ad-hoc untuk feeder dikti, akreditasi BAN-PT, evaluasi kinerja dosen (EKD), dan eksekutif dashboard management.
                  </p>
                </div>
              </div>

              {/* 6 Report Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => triggerToast("Mengekspor Laporan Forlap PDDikti (Feeder XML/JSON)...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">☁️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Laporan Forlap Dikti</h3>
                    <p className="text-xs text-slate-500 mt-1">Sync otomatis ke PDDikti per semester</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerToast("Mengunduh KHS & Transkrip Massal sebagai PDF ZIP...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">📋</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">KHS & Transkrip Massal</h3>
                    <p className="text-xs text-slate-500 mt-1">Generate dokumen per angkatan / prodi</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerToast("Mengunduh Rekap Distribusi Beban Mengajar Dosen...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">👨‍🏫</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Beban Mengajar Dosen</h3>
                    <p className="text-xs text-slate-500 mt-1">Distribusi SKS & jam/minggu 152 Dosen</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerToast("Mengunduh Laporan EKD (Evaluasi Kinerja Dosen)...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">🏆</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">EKD Dosen</h3>
                    <p className="text-xs text-slate-500 mt-1">Evaluasi Kinerja Dosen per semester</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerToast("Mengunduh Matriks Data 9 Kriteria Akreditasi BAN-PT...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">🎖️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Akreditasi BAN-PT</h3>
                    <p className="text-xs text-slate-500 mt-1">Data 9 kriteria instrumen APS</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerToast("Mengunduh Daftar Peserta Yudisium Siap Wisuda...")}
                  className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
                >
                  <span className="text-3xl block">🎓</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Daftar Yudisium</h3>
                    <p className="text-xs text-slate-500 mt-1">Mahasiswa siap wisuda & transkrip akhir</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB: PENGATURAN */}
          {activeTab === "pengaturan" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Pengaturan Parameter Akademik SIAKAD</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Konfigurasi Format NIM, Bobot Nilai, Kehadiran LMS, Syarat Kelulusan, & Batas SKS.</p>
                </div>
                <button
                  onClick={() => triggerToast("Seluruh pengaturan parameter akademik berhasil disimpan dan diterapkan!")}
                  className="px-5 py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  💾 Simpan Semua Pengaturan
                </button>
              </div>

              {/* 1. Format Generator NIM */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">1. Format Custom Generator NIM</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pilih dan atur urutan komponen nomor induk mahasiswa baru.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand-50 text-[#0f487b] font-mono font-bold text-xs rounded-lg">
                    Preview NIM: 26090182
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono font-bold text-slate-700">
                    <span>[YY] Tahun (26)</span>
                    <span className="text-slate-400 text-[10px]">Tag 1</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono font-bold text-slate-700">
                    <span>[PP] Kode Prodi (09)</span>
                    <span className="text-slate-400 text-[10px]">Tag 2</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono font-bold text-slate-700">
                    <span>[G] Gelombang (0)</span>
                    <span className="text-slate-400 text-[10px]">Tag 3</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono font-bold text-slate-700">
                    <span>[NNN] No Urut (182)</span>
                    <span className="text-slate-400 text-[10px]">Tag 4</span>
                  </div>
                </div>
              </div>

              {/* 2. Bobot Komponen Evaluasi Nilai */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">2. Bobot Komponen Evaluasi Nilai (Total wajib 100%)</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Penetapan persentase Tugas, Kuis, UTS, dan UAS perkuliahan.</p>
                  </div>
                  <button
                    onClick={() => triggerToast("Bobot nilai berhasil disimpan!")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                  >
                    Tetapkan Bobot Nilai
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bobot Tugas (%)</label>
                    <input type="number" defaultValue={20} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bobot Kuis (%)</label>
                    <input type="number" defaultValue={10} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bobot UTS (%)</label>
                    <input type="number" defaultValue={30} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bobot UAS (%)</label>
                    <input type="number" defaultValue={40} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center" />
                  </div>
                </div>
              </div>

              {/* 3. Aturan Kehadiran Perkuliahan LMS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">3. Aturan Kehadiran & Syarat Ikut UAS (Integrasi LMS)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Minimum Kehadiran (%)</label>
                    <input type="number" defaultValue={75} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Toleransi Sakit (Sesi)</label>
                    <input type="number" defaultValue={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Toleransi Izin (Sesi)</label>
                    <input type="number" defaultValue={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                </div>
              </div>

              {/* 4. Batas SKS Maksimum Berdasarkan IPK */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">4. Batas Maksimum Pengambilan SKS KRS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Maksimum SKS untuk IPK {">"}= 3.00</label>
                    <input type="number" defaultValue={24} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Maksimum SKS untuk IPK {"<"} 3.00</label>
                    <input type="number" defaultValue={20} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
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
