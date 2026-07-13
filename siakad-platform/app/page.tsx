"use client";

import { useState } from "react";
import Link from "next/link";
import { useRole } from "./context/RoleContext";
import { LOGO_URL, INSTITUTION_SHORT_NAME, INSTITUTION_NAME } from "@/lib/client-config";

type OnboardTab = "dashboard" | "ukt" | "krs" | "ktm";

export default function OnboardingPage() {
  const { user, logout, loading } = useRole();
  const [activeTab, setActiveTab] = useState<OnboardTab>("dashboard");
  const [uktStatus, setUktStatus] = useState<"unpaid" | "processing" | "paid">("unpaid");
  const [nimIssued, setNimIssued] = useState(false);
  const [showNimModal, setShowNimModal] = useState(false);
  const [copiedNim, setCopiedNim] = useState(false);
  const [selectedVa, setSelectedVa] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedKrs, setSelectedKrs] = useState<string[]>([]);
  const [krsSubmitted, setKrsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a345c] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Connecting to SSO Identity Provider...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const nimDigits = "26090182";

  const krsCourses = [
    { id: "inf101", code: "INF101", name: "Pemrograman Dasar", sks: 4, type: "Wajib" },
    { id: "inf102", code: "INF102", name: "Kalkulus I", sks: 3, type: "Wajib" },
    { id: "inf103", code: "INF103", name: "Struktur Data & Algoritma", sks: 4, type: "Wajib" },
    { id: "mku101", code: "MKU101", name: "Pendidikan Pancasila", sks: 2, type: "MKU" },
    { id: "inf104", code: "INF104", name: "Pengantar Teknologi Informasi", sks: 3, type: "Wajib" },
  ];

  const handlePaySimulation = () => {
    setUktStatus("processing");
    setTimeout(() => {
      setUktStatus("paid");
      setNimIssued(true);
      setShowNimModal(true);
      triggerToast("Pembayaran UKT berhasil diverifikasi!");
    }, 1200);
  };

  const handleCopyNim = () => {
    navigator.clipboard?.writeText(nimDigits);
    setCopiedNim(true);
    triggerToast("NIM berhasil disalin!");
    setTimeout(() => setCopiedNim(false), 2000);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSelectCourse = (courseId: string) => {
    if (selectedKrs.includes(courseId)) {
      setSelectedKrs(selectedKrs.filter((id) => id !== courseId));
    } else {
      setSelectedKrs([...selectedKrs, courseId]);
    }
  };

  const handleSubmitKrs = () => {
    setKrsSubmitted(true);
    triggerToast("KRS Perdana berhasil diajukan!");
  };

  const currentYear = new Date().getFullYear();

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
          <img
            src={LOGO_URL}
            alt={`Logo ${INSTITUTION_SHORT_NAME}`}
            className="h-8 object-contain brightness-0 invert"
          />
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">{user?.name}</h3>
              <p className="text-[10px] text-white/60 font-bold mt-0.5 tracking-wider font-mono">
                {nimIssued ? nimDigits : "Calon Mahasiswa"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">
            Portal Onboarding Akademik
          </p>

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
            <span>Beranda SIAKAD</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("ukt");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "ukt"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>💵</span>
            <span>Daftar Ulang & UKT</span>
            {uktStatus !== "paid" && <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
          </button>

          <button
            disabled={!nimIssued}
            onClick={() => {
              setActiveTab("krs");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              !nimIssued
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "krs"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📝</span>
            <span>Isi KRS Perdana</span>
            {!nimIssued && <span className="ml-auto text-xs">🔒</span>}
          </button>

          <button
            disabled={!nimIssued}
            onClick={() => {
              setActiveTab("ktm");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              !nimIssued
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "ktm"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🪪</span>
            <span>KTM Digital</span>
            {!nimIssued && <span className="ml-auto text-xs">🔒</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 text-xs"
          >
            🏢 Portal Mahasiswa Reguler
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            🚪 Keluar SSO
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
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Onboarding On-Line</h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                Semester Ganjil {currentYear}/{currentYear + 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold">Budi Santoso</span>
            <span className="h-8 w-px bg-slate-200"></span>
            <span className="text-slate-400 cursor-pointer">🔔</span>
          </div>
        </header>

        {/* Tab content wrapper */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 fade-in">
              <div className="bg-gradient-to-r from-[#0f487b] to-[#00719f] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl text-white">
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-[#FED524] text-[#0f487b] text-4xl font-extrabold flex items-center justify-center border-4 border-white/20 shrink-0">
                    🎓
                  </div>
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Budi Santoso</h1>
                    <p className="text-brand-100 text-sm font-medium mb-3">Program Studi S1 Informatika (PJJ)</p>
                    <div className="flex items-center gap-2 text-xs text-white/80 bg-black/20 w-max px-3 py-1.5 rounded-lg border border-white/10">
                      Status Onboarding: {nimIssued ? "Mahasiswa Aktif (NIM Terbit)" : "Daftar Ulang & Bayar UKT"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Alur Onboarding Mahasiswa Baru</h2>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {[
                    { label: "Bayar UKT", status: uktStatus === "paid" ? "completed" : "current", desc: "Daftar ulang & Uang Kuliah Tunggal" },
                    { label: "Terbit NIM", status: nimIssued ? "completed" : "upcoming", desc: "Penerbitan Nomor Induk Mahasiswa" },
                    { label: "Isi KRS Perdana", status: krsSubmitted ? "completed" : nimIssued ? "current" : "upcoming", desc: "Penyusunan Rencana Studi" },
                    { label: "Cetak KTM", status: krsSubmitted ? "completed" : "upcoming", desc: "Unduh Kartu Tanda Mahasiswa Digital" },
                  ].map((st, i) => (
                    <div key={i} className="flex md:flex-col items-center gap-3 flex-1">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                          st.status === "completed"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : st.status === "current"
                            ? "bg-[#0f487b] text-white border-[#0f487b]"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {st.status === "completed" ? "✓" : i + 1}
                      </div>
                      <div className="text-left md:text-center">
                        <h4 className="text-xs font-bold text-slate-800">{st.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UKT */}
          {activeTab === "ukt" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Biaya Daftar Ulang (UKT) Semester 1</h2>
              {uktStatus === "paid" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <span className="text-emerald-500 text-3xl">✓</span>
                  <h3 className="font-bold text-slate-800 mt-2">Tagihan Daftar Ulang Lunas</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Uang Kuliah Tunggal semester ini telah lunas. Nomor Induk Mahasiswa Anda telah diterbitkan.
                  </p>
                  <button
                    onClick={() => setActiveTab("krs")}
                    className="mt-4 px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all"
                  >
                    Lanjut Isi KRS Perdana
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Pilih Metode Pembayaran</h3>
                    <div className="space-y-2">
                      {["BNI Virtual Account", "Mandiri Virtual Account"].map((va) => (
                        <button
                          key={va}
                          onClick={() => setSelectedVa(va)}
                          className={`w-full p-4 border rounded-xl flex items-center justify-between transition-all ${
                            selectedVa === va ? "border-[#0f487b] bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-semibold text-slate-700 text-sm">{va}</span>
                          <span className="text-xs text-slate-400">Verifikasi Otomatis</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Tagihan UKT</span>
                      <span className="font-bold text-[#0f487b]">Rp 3.500.000</span>
                    </div>

                    <button
                      disabled={!selectedVa}
                      onClick={handlePaySimulation}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all text-sm ${
                        selectedVa
                          ? "bg-[#0f487b] hover:bg-[#00719f] cursor-pointer shadow-md"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {uktStatus === "processing" ? "Memverifikasi Pembayaran..." : "Bayar Tagihan UKT (Simulasi)"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KRS */}
          {activeTab === "krs" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Isi KRS Perdana</h2>
                  <p className="text-sm text-slate-500">Mata kuliah semester 1 paket dasar program studi S1 Informatika.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total SKS Terpilih</span>
                  <p className="text-xl font-extrabold text-[#0f487b]">
                    {krsCourses.filter((c) => selectedKrs.includes(c.id)).reduce((acc, c) => acc + c.sks, 0)} SKS
                  </p>
                </div>
              </div>

              {krsSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <span className="text-emerald-500 text-3xl">✓</span>
                  <h3 className="font-bold text-slate-800 mt-2">KRS Berhasil Dikirim</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Rencana Studi Anda telah disubmit dan sedang menunggu verifikasi dari dosen Pembimbing Akademik (PA).
                  </p>
                  <button
                    onClick={() => setActiveTab("ktm")}
                    className="mt-4 px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all"
                  >
                    Buka KTM Digital
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-400 uppercase tracking-widest">
                      Daftar Pilihan Mata Kuliah
                    </div>
                    <div className="divide-y divide-slate-100">
                      {krsCourses.map((c) => {
                        const checked = selectedKrs.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCourse(c.id)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                              checked ? "bg-blue-50/20" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center ${
                                  checked ? "bg-[#0f487b] border-[#0f487b]" : "bg-white border-slate-300"
                                }`}
                              >
                                {checked && <span className="text-white text-xs">✓</span>}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                                <span className="text-xs text-slate-400 ml-2">({c.code})</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {c.sks} SKS
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitKrs}
                    disabled={selectedKrs.length === 0}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all text-sm ${
                      selectedKrs.length > 0
                        ? "bg-[#0f487b] hover:bg-[#00719f] cursor-pointer shadow-md"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Ajukan KRS Perdana
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KTM */}
          {activeTab === "ktm" && (
            <div className="max-w-md mx-auto space-y-6 fade-in py-6">
              <h2 className="text-xl font-bold text-slate-800 text-center">Kartu Tanda Mahasiswa Digital</h2>
              <div className="rounded-3xl shadow-xl overflow-hidden bg-gradient-to-br from-[#0f487b] to-[#00719f] p-6 text-white relative aspect-[1.58/1] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-black text-lg tracking-tight">KTM DIGITAL</h3>
                    <p className="text-[9px] text-[#FED524] font-bold tracking-widest uppercase">{INSTITUTION_NAME}</p>
                  </div>
                  <span className="text-2xl">🏛️</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#FED524] flex items-center justify-center font-bold text-[#0f487b] text-xl border border-white/20 shrink-0">
                    BS
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-base truncate">Budi Santoso</h4>
                    <p className="font-mono text-xs text-white/80 mt-0.5 tracking-wider">{nimDigits}</p>
                    <p className="text-[9px] text-[#FED524] font-bold mt-1 uppercase tracking-wider">S1 Informatika</p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-3 text-[8px] text-white/50">
                  <span>Diterbitkan: {new Date().toLocaleDateString("id-ID")}</span>
                  <span className="font-mono text-[9px] text-[#FED524]">{INSTITUTION_SHORT_NAME}-STUDENT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NIM ISSUANCE MODAL */}
      {showNimModal && (
        <div className="fixed inset-0 z-50 bg-[#0a345c]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pop">
            <div className="h-[3px] bg-gradient-to-r from-[#0f487b] to-[#00719f]"></div>
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow">
                ✓
              </div>
              <h2 className="font-display text-xl font-bold text-slate-800">Nomor Induk Mahasiswa Diterbitkan</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Registrasi Anda terverifikasi. Nomor Induk Mahasiswa (NIM) resmi Anda adalah:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-[#0f487b] tracking-wider pl-4">{nimDigits}</span>
                <button
                  onClick={handleCopyNim}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:text-[#0f487b] text-xs font-bold rounded-lg transition-all"
                >
                  {copiedNim ? "Tersalin!" : "Salin"}
                </button>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setShowNimModal(false);
                  setActiveTab("krs");
                }}
                className="w-full py-3 bg-[#0f487b] text-white font-bold rounded-xl hover:bg-[#00719f] text-xs shadow-md"
              >
                Lanjutkan ke Pengisian KRS
              </button>
            </div>
          </div>
        </div>
      )}

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
