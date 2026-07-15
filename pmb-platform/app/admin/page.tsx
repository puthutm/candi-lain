"use client";

import React, { useState, useEffect } from "react";
import { INSTITUTION_SHORT_NAME, SSO_AUTHORIZE_URL, SSO_CLIENT_ID, SSO_CALLBACK_URL } from "@/lib/client-config";

type AdminPanelType =
  | "dashboard"
  | "monitoring"
  | "pendaftar"
  | "verifikasi"
  | "komunikasi"
  | "gelombang";

interface ApplicantRow {
  id: string; // Database UUID
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  currentStage: "peminat" | "pendaftar" | "isi_biodata" | "unggah_berkas" | "siap_ujian" | "sedang_ujian" | "selesai_ujian" | "diterima" | "tidak_lulus";
  paymentStatus: "belum_bayar" | "lunas";
  createdAt: string;
  wave: string;
  entryPath: string;
  entryPathFee: string;
  studyProgram: string;
  docsCount: number;
}

interface WaveRow {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "belum_dibuka" | "aktif" | "tertutup";
}

interface DocumentRow {
  id: string;
  applicantId: string;
  documentTypeId: string;
  fileUrl: string;
  status: "belum_upload" | "menunggu_verifikasi" | "terverifikasi" | "perlu_revisi";
  revisionNote: string | null;
  uploadedAt: string;
  documentTypeName: string;
  documentTypeCode: string;
}

interface DocEvaluation {
  status: "terverifikasi" | "perlu_revisi";
  revisionNote: string;
}

export default function AdminPage() {
  const [activePanel, setActivePanel] = useState<AdminPanelType>("dashboard");
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [waves, setWaves] = useState<WaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Communication & Campaign states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isSendingBlast, setIsSendingBlast] = useState(false);
  const [blastName, setBlastName] = useState("");
  const [blastSegment, setBlastSegment] = useState("Tahap 4: Unggah Berkas (Belum Bayar)");
  const [blastChannel, setBlastChannel] = useState("email");
  const [blastMessage, setBlastMessage] = useState("");
  
  // Auth state
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verification panel state
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRow | null>(null);
  const [selectedApplicantDocs, setSelectedApplicantDocs] = useState<DocumentRow[]>([]);
  const [docEvaluations, setDocEvaluations] = useState<Record<string, DocEvaluation>>({});
  const [isSubmittingVerif, setIsSubmittingVerif] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const redirectToSSO = () => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    sessionStorage.setItem("sso_code_verifier", verifier);

    let authUrl = SSO_AUTHORIZE_URL;
    let cbUrl = SSO_CALLBACK_URL;
    if (typeof window !== "undefined") {
      const currentHost = window.location.host; // e.g., "10.10.20.56:3002"
      cbUrl = `${window.location.protocol}//${currentHost}/api/auth/callback`;
      const ssoHost = window.location.hostname; // e.g., "10.10.20.56"
      authUrl = `${window.location.protocol}//${ssoHost}:3000/oauth/authorize`;
    }

    window.location.href = `${authUrl}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(cbUrl)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const applicantsRes = await fetch("/api/applicants");
      const applicantsData = await applicantsRes.json();

      const metaRes = await fetch("/api/meta");
      const metaData = await metaRes.json();

      const blastRes = await fetch("/api/admin/blast");
      const blastData = await blastRes.json();

      if (applicantsData.success) {
        setApplicants(applicantsData.applicants || []);
      } else {
        throw new Error(applicantsData.error || "Gagal mengambil data pendaftar");
      }

      if (metaData.success) {
        setWaves(metaData.waves || []);
      } else {
        throw new Error(metaData.error || "Gagal mengambil metadata");
      }

      if (blastData.success) {
        setCampaigns(blastData.campaigns || []);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi API server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.success && data.authenticated && data.user && data.user.role === "admin") {
          setAdminUser(data.user);
          setCheckingAuth(false);
          fetchData();
        } else {
          redirectToSSO();
        }
      } catch (err) {
        redirectToSSO();
      }
    };
    checkSession();
  }, []);

  // Fetch documents when applicant is selected
  useEffect(() => {
    const fetchDocs = async () => {
      if (!selectedApplicant) {
        setSelectedApplicantDocs([]);
        setDocEvaluations({});
        return;
      }

      try {
        const res = await fetch(`/api/applicants/${selectedApplicant.id}`);
        const data = await res.json();
        if (data.success) {
          const docsList: DocumentRow[] = data.documents || [];
          setSelectedApplicantDocs(docsList);

          // Initialize evaluations mapping
          const initialEvals: Record<string, DocEvaluation> = {};
          docsList.forEach((doc) => {
            initialEvals[doc.id] = {
              status: doc.status === "perlu_revisi" ? "perlu_revisi" : "terverifikasi",
              revisionNote: doc.revisionNote || "",
            };
          });
          setDocEvaluations(initialEvals);
        }
      } catch (err) {
        console.error("Gagal memuat dokumen kandidat:", err);
      }
    };

    fetchDocs();
  }, [selectedApplicant]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant || selectedApplicantDocs.length === 0) return;

    setIsSubmittingVerif(true);
    try {
      const payload = selectedApplicantDocs.map((doc) => ({
        applicantId: selectedApplicant.id,
        documentId: doc.id,
        status: docEvaluations[doc.id]?.status || "terverifikasi",
        revisionNote: docEvaluations[doc.id]?.status === "perlu_revisi" ? docEvaluations[doc.id]?.revisionNote : "",
      }));

      const res = await fetch("/api/applicants/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(`Evaluasi dokumen ${selectedApplicant.fullName} berhasil disimpan!`);
        setSelectedApplicant(null);
        fetchData();
      } else {
        triggerToast(`Gagal verifikasi: ${data.error || "Terjadi kesalahan"}`);
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setIsSubmittingVerif(false);
    }
  };

  const handleSeedDb = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (data.success) {
        triggerToast("Database master dan kandidat simulasi berhasil ditambahkan!");
        fetchData();
      } else {
        triggerToast(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blastName || !blastMessage) {
      triggerToast("Semua kolom wajib diisi!");
      return;
    }
    setIsSendingBlast(true);
    try {
      const res = await fetch("/api/admin/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blastName,
          segment: blastSegment,
          channel: blastChannel,
          message: blastMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || "Kampanye Blast berhasil dikirim!");
        setBlastName("");
        setBlastMessage("");
        
        // Refresh campaign history
        const blastRes = await fetch("/api/admin/blast");
        const blastData = await blastRes.json();
        if (blastData.success) {
          setCampaigns(blastData.campaigns || []);
        }
      } else {
        triggerToast("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setIsSendingBlast(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "peminat":
        return "Peminat (Leads)";
      case "pendaftar":
        return "Pendaftar";
      case "isi_biodata":
        return "Isi Biodata";
      case "unggah_berkas":
        return "Unggah Berkas";
      case "siap_ujian":
        return "Siap Ujian (CBT)";
      case "sedang_ujian":
        return "Sedang Ujian";
      case "selesai_ujian":
        return "Selesai Ujian";
      case "diterima":
        return "Diterima (Lolos)";
      case "tidak_lulus":
        return "Tidak Lulus";
      default:
        return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "peminat":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "pendaftar":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "isi_biodata":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "unggah_berkas":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "siap_ujian":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "sedang_ujian":
        return "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse";
      case "selesai_ujian":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "diterima":
        return "bg-green-100 text-green-800 border border-green-300";
      case "tidak_lulus":
        return "bg-slate-100 text-slate-700 border border-slate-300";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  // KPIs
  const totalPendaftar = applicants.length;
  const needVerif = applicants.filter((a) => a.currentStage === "unggah_berkas").length;
  const lulusCount = applicants.filter((a) => a.currentStage === "diterima").length;

  const totalRevenue = applicants
    .filter((a) => a.paymentStatus === "lunas")
    .reduce((sum, a) => sum + parseFloat(a.entryPathFee || "0"), 0);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    }
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  // Funnel counts mapping
  const funnelStages = [
    { name: "1. Peminat (Leads)", count: applicants.filter((a) => a.currentStage === "peminat").length },
    { name: "2. Pendaftar", count: applicants.filter((a) => a.currentStage === "pendaftar").length },
    { name: "3. Isi Biodata", count: applicants.filter((a) => a.currentStage === "isi_biodata").length },
    { name: "4. Unggah Berkas", count: applicants.filter((a) => a.currentStage === "unggah_berkas").length },
    { name: "5. Siap Ujian (CBT)", count: applicants.filter((a) => a.currentStage === "siap_ujian").length },
    { name: "6. Sedang Ujian", count: applicants.filter((a) => a.currentStage === "sedang_ujian").length },
    { name: "7. Selesai Ujian", count: applicants.filter((a) => a.currentStage === "selesai_ujian").length },
    { name: "8. Diterima (Lolos)", count: applicants.filter((a) => a.currentStage === "diterima").length },
  ];

  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (checkingAuth || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f7f9] text-[#0f487b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-transparent border-[#0f487b] rounded-full animate-spin"></div>
          <span className="font-bold text-sm tracking-wide">
            {checkingAuth ? "Memvalidasi sesi admin..." : "Memuat data panel admin..."}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f7f9] text-rose-600">
        <div className="text-center p-8 bg-white rounded-2xl border border-rose-200 shadow-md">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold mt-3">Gagal Memuat Data</h2>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-[#0f487b] text-white rounded-lg hover:bg-[#00719f] font-bold text-xs"
          >
            Coba Lagi
          </button>
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
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#0a345c] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#ecc94b] flex items-center justify-center font-bold text-[#0f487b]">
              PMB
            </span>
            <span className="text-white font-bold tracking-tight text-sm">Admin PMB {INSTITUTION_SHORT_NAME}</span>
          </div>
        </div>

        {/* Admin profile */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ecc94b] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-white truncate text-sm">{adminUser?.name || "Admin"}</h3>
              <p className="text-[10px] text-[#ecc94b] font-bold tracking-wider uppercase font-mono">
                {adminUser?.role === "admin" ? "Super Admin" : adminUser?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-0.5">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2 mt-2">
            Operasional
          </p>

          <button
            onClick={() => {
              setActivePanel("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activePanel === "dashboard"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Beranda</span>
          </button>

          <button
            onClick={() => {
              setActivePanel("monitoring");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activePanel === "monitoring"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📊</span>
            <span>Monitoring Funnel</span>
          </button>

          <button
            onClick={() => {
              setActivePanel("pendaftar");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activePanel === "pendaftar"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👥</span>
            <span>Data Pendaftar</span>
            <span className="ml-auto bg-white/10 text-[#ecc94b] text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
              {totalPendaftar}
            </span>
          </button>

          <button
            onClick={() => {
              setActivePanel("verifikasi");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activePanel === "verifikasi"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🛡️</span>
            <span>Verifikasi Berkas</span>
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
              {needVerif}
            </span>
          </button>

          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2 mt-5 pt-3 border-t border-white/10">
            Konfigurasi
          </p>

          <button
            onClick={() => {
              setActivePanel("gelombang");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activePanel === "gelombang"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📅</span>
            <span>Gelombang & Kuota</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 flex flex-col gap-2">
          <button
            onClick={handleSeedDb}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-300 font-bold rounded-lg hover:bg-yellow-500 hover:text-slate-900 transition-colors text-xs border border-yellow-500/20 disabled:opacity-50"
          >
            ✨ {isSeeding ? "Seeding..." : "Seed Mock Data"}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-300 font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-colors text-xs border border-rose-500/20"
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-10 shrink-0 w-full">
          <div className="flex items-center gap-3 lg:gap-5 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-[#0f487b] transition-colors p-2 -ml-2 rounded-lg lg:hidden"
            >
              ☰
            </button>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</p>
              <h1 className="text-base font-bold text-slate-800">
                {activePanel === "dashboard"
                  ? "Beranda Analitik"
                  : activePanel === "monitoring"
                  ? "Monitoring Funnel PMB"
                  : activePanel === "pendaftar"
                  ? "Data Pendaftar"
                  : activePanel === "verifikasi"
                  ? "Verifikasi Berkas Masuk"
                  : activePanel === "komunikasi"
                  ? "Komunikasi & Blast Kampanye"
                  : "Pengaturan Gelombang"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{adminUser?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-500">{adminUser?.role === "admin" ? "Super Admin" : adminUser?.role}</p>
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.name || "Admin")}&background=f0f4f8&color=0f487b&rounded=true&bold=true`}
              className="w-9 h-9 rounded-full border border-slate-200"
            />
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 w-full">
          {/* PANEL 1: DASHBOARD */}
          {activePanel === "dashboard" && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{todayFormatted}</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                    Selamat siang, {adminUser?.name ? adminUser.name.split(" ")[0] : "Admin"} 👋
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Berikut ringkasan pendaftaran hari ini.</p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActivePanel("pendaftar")}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
                >
                  <span className="text-2xl">👥</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Total Pendaftar
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">{totalPendaftar}</p>
                </div>
                <div
                  onClick={() => setActivePanel("verifikasi")}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
                >
                  <span className="text-2xl">🛡️</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Perlu Verifikasi
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">{needVerif}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <span className="text-2xl">🎓</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Lulus Seleksi
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">{lulusCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <span className="text-2xl">💰</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Realisasi Biaya
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 2: MONITORING FUNNEL */}
          {activePanel === "monitoring" && (
            <div className="space-y-6 fade-in">
              <h2 className="text-lg font-bold text-slate-800">Funnel Pendaftaran Mahasiswa Baru (Aktif)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {funnelStages.map((st, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{st.name}</span>
                    <p className="text-2xl font-black mt-4 text-slate-800">{st.count.toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 3: DATA PENDAFTAR */}
          {activePanel === "pendaftar" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm fade-in">
              {applicants.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <p className="font-semibold text-sm">Belum ada data pendaftar.</p>
                  <p className="text-xs mt-1">Silakan seed mock data terlebih dahulu di bagian bawah menu sidebar.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Kandidat</th>
                      <th className="px-6 py-4">Nomor Ref</th>
                      <th className="px-6 py-4">Program Studi</th>
                      <th className="px-6 py-4">Tahapan</th>
                      <th className="px-6 py-4">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{a.fullName}</div>
                          <div className="text-xs text-slate-400">{a.email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#0f487b]">{a.registrationNumber}</td>
                        <td className="px-6 py-4 font-semibold">{a.studyProgram}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${getStageColor(a.currentStage)}`}>
                            {getStageLabel(a.currentStage)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              a.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {a.paymentStatus === "lunas" ? "Lunas" : "Belum Lunas"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* PANEL 4: VERIFIKASI BERKAS */}
          {activePanel === "verifikasi" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
              {/* Queue List */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-500 mb-2">Antrean Dokumen Pendaftar</h3>
                {applicants.filter((a) => a.currentStage === "unggah_berkas").length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm font-semibold">
                    🎉 Tidak ada berkas masuk yang perlu diverifikasi saat ini.
                  </div>
                ) : (
                  applicants
                    .filter((a) => a.currentStage === "unggah_berkas")
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedApplicant(a)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${
                          selectedApplicant?.id === a.id
                            ? "border-[#0f487b] bg-blue-50/50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-[#0f487b]/30"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-base">{a.fullName}</div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{a.registrationNumber} · {a.studyProgram}</p>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md">
                          {a.docsCount} Berkas Terunggah
                        </span>
                      </button>
                    ))
                )}
              </div>

              {/* Verification Form Workspace */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                {selectedApplicant ? (
                  <form onSubmit={handleVerifySubmit} className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Workspace Verifikator
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedApplicant.fullName}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedApplicant.registrationNumber}</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 block border-b pb-1.5">Evaluasi Berkas Kandidat</label>
                      {selectedApplicantDocs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Memuat dokumen...</p>
                      ) : (
                        selectedApplicantDocs.map((doc) => {
                          const docEval = docEvaluations[doc.id] || { status: "terverifikasi", revisionNote: "" };
                          return (
                            <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="max-w-[60%]">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={doc.documentTypeName}>
                                    {doc.documentTypeName}
                                  </p>
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-[#0f487b] font-semibold hover:underline block mt-0.5"
                                  >
                                    📄 Buka / Unduh Berkas
                                  </a>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  doc.status === "terverifikasi" ? "bg-emerald-100 text-emerald-700" :
                                  doc.status === "perlu_revisi" ? "bg-rose-100 text-rose-700" : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {doc.status === "terverifikasi" ? "Lolos" : doc.status === "perlu_revisi" ? "Revisi" : "Baru"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocEvaluations((prev) => {
                                      const current = prev[doc.id] || { status: "terverifikasi", revisionNote: "" };
                                      return {
                                        ...prev,
                                        [doc.id]: { status: "terverifikasi", revisionNote: current.revisionNote },
                                      };
                                    });
                                  }}
                                  className={`py-1 rounded-lg font-bold text-[10px] border text-center transition-all ${
                                    docEval.status === "terverifikasi"
                                      ? "bg-emerald-500 text-white border-emerald-500"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocEvaluations((prev) => {
                                      const current = prev[doc.id] || { status: "terverifikasi", revisionNote: "" };
                                      return {
                                        ...prev,
                                        [doc.id]: { status: "perlu_revisi", revisionNote: current.revisionNote },
                                      };
                                    });
                                  }}
                                  className={`py-1 rounded-lg font-bold text-[10px] border text-center transition-all ${
                                    docEval.status === "perlu_revisi"
                                      ? "bg-rose-500 text-white border-rose-500"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  Minta Revisi
                                </button>
                              </div>

                              {docEval.status === "perlu_revisi" && (
                                <textarea
                                  required
                                  rows={2}
                                  value={docEval.revisionNote}
                                  onChange={(e) => {
                                    setDocEvaluations((prev) => {
                                      const current = prev[doc.id] || { status: "perlu_revisi", revisionNote: "" };
                                      return {
                                        ...prev,
                                        [doc.id]: { status: current.status, revisionNote: e.target.value },
                                      };
                                    });
                                  }}
                                  placeholder="Catatan kesalahan dokumen..."
                                  className="w-full text-[10px] p-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-rose-500"
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingVerif || selectedApplicantDocs.length === 0}
                      className="w-full py-3 rounded-xl font-bold text-white text-xs bg-[#0f487b] hover:bg-[#00719f] transition-all shadow disabled:opacity-50"
                    >
                      {isSubmittingVerif ? "Menyimpan Evaluasi..." : "Kirim Evaluasi Verifikasi"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    💡 Pilih pendaftar pada daftar antrean untuk memulai proses verifikasi dokumen.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 5: KOMUNIKASI */}
          {activePanel === "komunikasi" && (
            <div className="space-y-6 max-w-5xl mx-auto fade-in">
              <h2 className="text-lg font-bold text-slate-800">Komunikasi Massal & Kampanye</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleSendBlast} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Buat Kampanye Baru</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-500">Nama Kampanye</label>
                      <input
                        type="text"
                        required
                        value={blastName}
                        onChange={(e) => setBlastName(e.target.value)}
                        placeholder="Mis. Reminder Pembayaran Gel 1"
                        className="w-full p-2.5 border border-slate-200 rounded-xl mt-1 text-xs outline-none focus:border-[#0f487b]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-500">Segmen Penerima</label>
                      <select
                        value={blastSegment}
                        onChange={(e) => setBlastSegment(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl mt-1 text-xs outline-none focus:border-[#0f487b]"
                      >
                        <option>Tahap 4: Unggah Berkas (Belum Bayar)</option>
                        <option>Tahap 7: Selesai Ujian (Menunggu Kelulusan)</option>
                        <option>Semua Pendaftar Aktif</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-500">Saluran Pengiriman</label>
                      <select
                        value={blastChannel}
                        onChange={(e) => setBlastChannel(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl mt-1 text-xs outline-none focus:border-[#0f487b]"
                      >
                        <option value="email">📧 Email Massal</option>
                        <option value="whatsapp">💬 WhatsApp Blast</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-500">Pesan Kampanye</label>
                      <textarea
                        rows={5}
                        required
                        value={blastMessage}
                        onChange={(e) => setBlastMessage(e.target.value)}
                        placeholder="Mis. Halo {nama}, harap segera selesaikan pembayaran biaya formulir pendaftaran Anda..."
                        className="w-full p-3 border border-slate-200 rounded-xl mt-1 text-xs outline-none focus:border-[#0f487b]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingBlast}
                      className="w-full py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl text-xs disabled:opacity-50 transition"
                    >
                      {isSendingBlast ? "Mengirim Blast..." : "Kirim Blast Sekarang"}
                    </button>
                  </div>
                </form>

                {/* Campaign History Log */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Riwayat Pengiriman Kampanye</h3>
                    {campaigns.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada riwayat pengiriman kampanye blast.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                              <th className="px-4 py-3">Nama Kampanye</th>
                              <th className="px-4 py-3">Saluran</th>
                              <th className="px-4 py-3">Penerima</th>
                              <th className="px-4 py-3">Waktu Kirim</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {campaigns.map((camp) => (
                              <tr key={camp.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-semibold text-slate-800">{camp.name}</td>
                                <td className="px-4 py-3 uppercase font-mono text-[10px]">
                                  {camp.channel === "email" ? "📧 Email" : "💬 WA"}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-700">{camp.sentCount} Orang</td>
                                <td className="px-4 py-3 text-slate-400">
                                  {new Date(camp.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded uppercase text-[9px]">
                                    {camp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 6: GELOMBANG */}
          {activePanel === "gelombang" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm fade-in">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Gelombang</th>
                    <th className="px-6 py-4">Periode</th>
                    <th className="px-6 py-4">Kode Ref</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waves.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{w.name}</td>
                      <td className="px-6 py-4">
                        {new Date(w.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - {new Date(w.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 font-semibold font-mono">{w.code}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          w.status === "aktif" ? "bg-emerald-100 text-emerald-700" :
                          w.status === "belum_dibuka" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {w.status === "aktif" ? "Aktif" : w.status === "belum_dibuka" ? "Belum Dibuka" : "Tutup"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
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
