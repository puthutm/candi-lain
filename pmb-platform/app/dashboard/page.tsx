"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  INSTITUTION_NAME,
  FORM_FEE_DISPLAY,
  PAYMENT_BANKS,
} from "@/lib/client-config";

type TabType = "dashboard" | "tagihan" | "data" | "ujian" | "pengumuman";

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "processing" | "paid">("unpaid");
  const [selectedVa, setSelectedVa] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});
  const [showUjianReady, setShowUjianReady] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRef, setCandidateRef] = useState("");
  const [candidateId, setCandidateId] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    const id = localStorage.getItem("pmb_applicant_id");
    if (id) {
      setCandidateId(id);
      fetch(`/api/applicants/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCandidateName(data.applicant.fullName);
            setCandidateRef(data.applicant.registrationNumber);
            if (data.applicant.paymentStatus === "lunas") {
              setPaymentStatus("paid");
            }
            if (data.applicant.currentStage === "siap_ujian" || data.applicant.currentStage === "selesai_ujian" || data.applicant.currentStage === "diterima") {
              setShowUjianReady(true);
            }
            // Map documents uploaded
            const files: { [key: string]: string } = {};
            data.documents.forEach((d: any) => {
              if (d.status === "terverifikasi" || d.status === "menunggu_verifikasi") {
                files[d.documentTypeId] = d.fileUrl;
              }
            });
            setUploadedFiles(files);
          }
        })
        .catch((err) => console.error(err));
    }
  }, []);

  const steps = [
    { label: "Buat Akun", status: "completed", desc: "Registrasi data dasar & akun" },
    {
      label: "Bayar Tagihan",
      status: paymentStatus === "paid" ? "completed" : "current",
      desc: paymentStatus === "paid" ? "Tagihan lunas" : "Konfirmasi pembayaran formulir",
    },
    {
      label: "Data & Berkas",
      status: paymentStatus === "paid" ? (Object.keys(uploadedFiles).length === 4 ? "completed" : "current") : "upcoming",
      desc: "Unggah dokumen pendukung",
    },
    {
      label: "Ujian CBT",
      status: Object.keys(uploadedFiles).length === 4 ? "current" : "upcoming",
      desc: "Mengikuti ujian modul tertulis",
    },
    { label: "Hasil Akhir", status: "upcoming", desc: "Surat kelulusan & NIM" },
  ];

  const handleFileUpload = (docCode: string) => {
    if (!candidateId) {
      setUploadedFiles((prev) => ({
        ...prev,
        [docCode]: "terunggah.pdf",
      }));
      if (Object.keys(uploadedFiles).length === 3) {
        setShowUjianReady(true);
      }
      return;
    }

    fetch("/api/applicants/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantId: candidateId,
        documentCode: docCode,
        fileUrl: `${docCode.toLowerCase()}_terunggah.pdf`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUploadedFiles((prev) => ({
            ...prev,
            [data.document.documentTypeId]: data.document.fileUrl,
          }));
          triggerToast(`Berkas ${docCode} berhasil diunggah!`);
          
          // Re-fetch progress
          fetch(`/api/applicants/${candidateId}`)
            .then(res => res.json())
            .then(resData => {
              if (resData.success && resData.applicant.currentStage === "unggah_berkas") {
                triggerToast("Semua berkas selesai terunggah.");
              }
            });
        } else {
          triggerToast("Gagal: " + data.error);
        }
      })
      .catch(() => triggerToast("Gagal menghubungi server"));
  };

  const currentYear = new Date().getFullYear();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#00719f] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#ecc94b] flex items-center justify-center font-bold text-[#0f487b]">
              PMB
            </span>
            <span className="text-white font-bold tracking-tight text-sm">Dashboard Pendaftar</span>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#ecc94b] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                {candidateName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "BS"}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">{candidateName}</h3>
              <p className="text-[10px] text-[#ecc94b] font-bold mt-0.5 tracking-wider uppercase font-mono">
                {candidateRef}
              </p>
            </div>
          </div>

          <div className="mt-4 px-3 py-2 bg-white/10 border border-white/5 rounded-lg flex items-center gap-2">
            <span className="text-white/70">🎧</span>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Direferensikan Oleh Agen</p>
              <p className="text-[11px] font-semibold text-white truncate">Mitra Edukasi Jakarta</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Menu Seleksi</p>

          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "dashboard"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Beranda Pendaftar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tagihan");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "tagihan"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>💵</span>
            <span>Daftar Tagihan</span>
            {paymentStatus === "unpaid" && (
              <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            disabled={paymentStatus !== "paid"}
            onClick={() => {
              setActiveTab("data");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              paymentStatus !== "paid"
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "data"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📁</span>
            <span>Lengkapi Berkas</span>
            {paymentStatus !== "paid" && <span className="ml-auto text-xs">🔒</span>}
          </button>

          <button
            disabled={!showUjianReady && Object.keys(uploadedFiles).length < 4}
            onClick={() => {
              setActiveTab("ujian");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              (!showUjianReady && Object.keys(uploadedFiles).length < 4)
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "ujian"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📝</span>
            <span>Ujian Seleksi (CBT)</span>
            {!showUjianReady && Object.keys(uploadedFiles).length < 4 && <span className="ml-auto text-xs">🔒</span>}
          </button>

          <button
            disabled
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm text-white/40 opacity-50 cursor-not-allowed"
          >
            <span>📢</span>
            <span>Pengumuman Akhir</span>
            <span className="ml-auto text-xs">🔒</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/15 text-rose-300 font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all text-xs border border-rose-500/20"
          >
            🚪 Keluar
          </button>
        </div>
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
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                {activeTab === "dashboard"
                  ? "Beranda Pendaftar"
                  : activeTab === "tagihan"
                  ? "Daftar Tagihan"
                  : activeTab === "data"
                  ? "Lengkapi Berkas"
                  : "Ujian Seleksi CBT"}
              </h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                T.A {currentYear}/{currentYear + 1} Ganjil
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{candidateName}</span>
            <span className="h-8 w-px bg-slate-200"></span>
            <span className="text-slate-500 hover:text-[#0f487b] cursor-pointer">🔔</span>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 fade-in">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0f487b] to-[#00719f] rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-xl text-white">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    {paymentStatus === "paid" ? "Status: Menunggu Unggah Berkas" : "Aksi Diperlukan: Pembayaran"}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">
                    Selamat datang, {candidateName.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-slate-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    {paymentStatus === "paid"
                      ? "Pembayaran Anda telah lunas. Silakan lengkapi berkas persyaratan administrasi Anda pada tab 'Lengkapi Berkas'."
                      : "Anda telah terdaftar melalui agen Mitra Edukasi Jakarta. Untuk melanjutkan ke tahap pengisian berkas pendaftaran dan ujian CBT, silakan selesaikan pembayaran biaya formulir terlebih dahulu."}
                  </p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Alur Seleksi PMB</h2>
                <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex md:flex-col items-center md:items-center gap-4 md:gap-2 flex-1">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border transition-all ${
                          st.status === "completed"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : st.status === "current"
                            ? "bg-[#0f487b] text-white border-[#0f487b] ring-4 ring-[#0f487b]/10"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {st.status === "completed" ? "✓" : idx + 1}
                      </div>
                      <div className="text-left md:text-center">
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{st.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tagihan Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-[#0f487b] text-2xl font-bold">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">S1 Informatika</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{INSTITUTION_NAME}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-bold">
                        Online
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded font-bold">
                        PJJ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 text-sm border-t border-b md:border-none py-3 md:py-0 w-full md:w-auto">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jalur Seleksi</p>
                    <p className="font-bold text-slate-700 mt-0.5">Reguler</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biaya Tagihan</p>
                    <p className="font-bold text-slate-700 mt-0.5">{FORM_FEE_DISPLAY}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                    <p
                      className={`font-bold mt-0.5 ${
                        paymentStatus === "paid" ? "text-emerald-600" : "text-rose-500 animate-pulse"
                      }`}
                    >
                      {paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}
                    </p>
                  </div>
                </div>

                {paymentStatus !== "paid" && (
                  <button
                    onClick={() => setActiveTab("tagihan")}
                    className="px-5 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all whitespace-nowrap shadow-md"
                  >
                    Bayar Sekarang →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TAGIHAN */}
          {activeTab === "tagihan" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Pembayaran Formulir Pendaftaran</h2>
              {paymentStatus === "paid" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <span className="text-emerald-500 text-3xl">✓</span>
                  <h3 className="font-bold text-slate-800 mt-2">Pembayaran Formulir Lunas</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Terima kasih, tagihan Anda telah terverifikasi secara instan. Silakan lanjutkan pengisian berkas.
                  </p>
                  <button
                    onClick={() => setActiveTab("data")}
                    className="mt-4 px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all"
                  >
                    Lengkapi Berkas Pendaftaran
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Bank Selection */}
                  <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Pilih Virtual Account</h3>
                    <div className="space-y-2">
                      {PAYMENT_BANKS.map((va) => {
                        const isSelected = selectedVa === va;
                        return (
                          <button
                            key={va}
                            onClick={() => setSelectedVa(va)}
                            className={`w-full p-4 border rounded-xl flex items-center justify-between transition-all ${
                              isSelected ? "border-[#0f487b] bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-semibold text-slate-700 text-sm">{va}</span>
                            <span className="text-xs text-slate-400">Verifikasi Instan</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Biaya Formulir</span>
                      <span className="font-bold text-[#0f487b]">{FORM_FEE_DISPLAY}</span>
                    </div>

                    <button
                      disabled={!selectedVa}
                      onClick={() => {
                        setPaymentStatus("processing");
                        setTimeout(() => {
                          setPaymentStatus("paid");
                          triggerToast("Pembayaran berhasil dikonfirmasi!");
                        }, 1200);
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all text-sm ${
                        selectedVa
                          ? "bg-[#0f487b] hover:bg-[#00719f] cursor-pointer shadow-md"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {paymentStatus === "processing" ? "Menghubungi Server..." : "Konfirmasi Pembayaran Simulasi"}
                    </button>
                  </div>

                  {/* Right Column: Invoice Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 h-fit space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Tagihan</h3>
                    <div>
                      <p className="text-xs text-slate-400">Nomor Invoice</p>
                      <p className="font-mono text-sm font-bold text-slate-800">INV-PMB-2026-09812</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Deskripsi</p>
                      <p className="text-xs text-slate-600 font-semibold">Formulir Masuk S1 Informatika - Reguler</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATA & BERKAS */}
          {activeTab === "data" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Lengkapi Dokumen Persyaratan</h2>
              <p className="text-sm text-slate-500 -mt-4">
                Unggah salinan dokumen dalam format PDF atau JPG. Batas maksimal ukuran file adalah 2MB.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Kartu Tanda Penduduk (KTP)", code: "ktp" },
                  { name: "Ijazah SMA/SMK atau SKL", code: "ijazah" },
                  { name: "Kartu Keluarga (KK)", code: "kk" },
                  { name: "Pas Foto 3x4 (Background Merah)", code: "foto" },
                ].map((doc) => {
                  const fileUploaded = uploadedFiles[doc.code];
                  return (
                    <div
                      key={doc.code}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Wajib Diunggah</p>
                      </div>
                      <div className="flex items-center justify-between">
                        {fileUploaded ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                            <span>✓</span>
                            <span>{fileUploaded}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Belum diunggah</span>
                        )}
                        <button
                          onClick={() => handleFileUpload(doc.code)}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            fileUploaded
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-[#0f487b] text-white hover:bg-[#00719f]"
                          }`}
                        >
                          {fileUploaded ? "Ganti File" : "Unggah Berkas"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(uploadedFiles).length === 4 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-blue-900 font-semibold text-center sm:text-left">
                    💡 Semua berkas selesai diunggah. Silakan klik lanjutkan untuk mengaktifkan tes seleksi CBT.
                  </div>
                  <button
                    onClick={() => setActiveTab("ujian")}
                    className="px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all shrink-0 shadow"
                  >
                    Lanjutkan ke Ujian CBT →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UJIAN */}
          {activeTab === "ujian" && (
            <div className="max-w-3xl mx-auto text-center space-y-6 fade-in py-10">
              <span className="text-5xl">📝</span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800">
                Sistem Seleksi CBT Online
              </h2>
              <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
                Anda dinyatakan siap untuk mengikuti ujian. Ujian terdiri dari 5 modul yang dipantau dengan timer. Pastikan koneksi internet stabil sebelum mulai.
              </p>
              <div className="pt-4">
                <Link
                  href="/exam"
                  className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 text-base"
                >
                  Mulai Ujian Seleksi Sekarang
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[210] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
