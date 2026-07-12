"use client";

import React, { useState } from "react";
import Link from "next/link";

type TabType = "dashboard" | "kurikulum" | "krs" | "khs" | "layanan";

export default function RegularStudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedKrs, setSelectedKrs] = useState<string[]>(["alg", "db"]);
  const [toastMessage, setToastMessage] = useState("");

  const krsCourses = [
    { id: "alg", code: "INF201", name: "Algoritma Lanjut & Kompleksitas", sks: 4, lecturer: "Dr. Budi Setiawan" },
    { id: "db", code: "INF202", name: "Basis Data Terdistribusi", sks: 3, lecturer: "Dr. Hendra Setiawan" },
    { id: "ai", code: "INF203", name: "Kecerdasan Buatan", sks: 3, lecturer: "Prof. Rina Kumala" },
    { id: "pjj", code: "INF204", name: "Arsitektur Sistem PJJ", sks: 3, lecturer: "Dr. Ade Wijaya" },
  ];

  const handleSelectCourse = (courseId: string) => {
    if (selectedKrs.includes(courseId)) {
      setSelectedKrs(selectedKrs.filter((id) => id !== courseId));
    } else {
      setSelectedKrs([...selectedKrs, courseId]);
    }
  };

  const handleKrsSubmit = () => {
    triggerToast("Pengajuan KRS Anda telah diajukan ke Dosen PA!");
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
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
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#00719f] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <img
            src="https://unsia.ac.id/wp-content/uploads/2022/11/LOGO-UNSIA-1.png"
            alt="Logo UNSIA"
            className="h-8 object-contain brightness-0 invert"
          />
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                BS
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">Budi Santoso</h3>
              <p className="text-[10px] text-white/60 font-bold mt-0.5 tracking-wider font-mono">26090182</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">
            Akademik & Perkuliahan
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
            <span>Beranda</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("kurikulum");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "kurikulum"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📖</span>
            <span>Data Kurikulum</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("krs");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "krs"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📚</span>
            <span>Isi KRS</span>
            <span className="ml-auto px-2 py-0.5 bg-yellow-400 text-slate-800 text-[8px] font-bold rounded uppercase">
              Aktif
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("khs");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "khs"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📊</span>
            <span>KHS & Transkrip</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FED524] text-[#0f487b] font-bold rounded-lg hover:bg-yellow-400 text-xs"
          >
            🚪 Buka Portal Onboarding
          </Link>
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
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">SIAKAD Reguler</h2>
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

        {/* Scrollable container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB 1: BERANDA */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2 bg-gradient-to-r from-[#0f487b] to-[#00719f] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow text-white">
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-[#FED524] text-[#0f487b] font-extrabold text-3xl border-4 border-white/20 flex items-center justify-center shrink-0">
                      BS
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase rounded-md tracking-wider">
                          ✓ Status: Aktif
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-white/80 border border-white/20 text-[9px] font-bold uppercase rounded-md tracking-wider">
                          Semester 3
                        </span>
                      </div>
                      <h1 className="font-display text-2xl font-bold mb-1">Budi Santoso</h1>
                      <p className="text-brand-100 text-sm font-medium mb-3">S1 Informatika (PJJ)</p>
                      <p className="text-xs text-white/80 bg-black/20 px-3 py-1 rounded-lg w-fit border border-white/10">
                        PA Advisor: Dr. Hendra Setiawan, M.Kom.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IPK Kumulatif</p>
                    <h3 className="font-display font-black text-3xl text-[#0f487b] mb-1">3.85</h3>
                    <p className="text-[10px] text-emerald-500 font-semibold">↑ Naik 0.15</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IPS Terakhir</p>
                    <h3 className="font-display font-black text-3xl text-[#0f487b] mb-1">3.90</h3>
                    <p className="text-[10px] text-slate-500">Semester Ganjil</p>
                  </div>
                  <div className="col-span-2 bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SKS Lulus</p>
                      <p className="font-display font-black text-2xl text-slate-800">
                        45 <span className="text-xs text-slate-400 font-semibold">/ 144 SKS</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0f487b] flex items-center justify-center font-bold text-xs">
                      31%
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Schedule & Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Schedule */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base">Jadwal Kuliah Hari Ini</h3>
                    <span className="text-xs font-bold text-[#0f487b] bg-blue-50 px-3 py-1 rounded-lg">Rabu, 16 Sep</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#0f487b]">08:00 - 10:30 WIB</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">
                          Sedang Berlangsung
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Struktur Data & Algoritma (Kelas A)</h4>
                      <p className="text-xs text-slate-500 mt-1">Dosen: Dr. Budi Setiawan</p>
                      <button className="mt-4 px-4 py-2 bg-[#0f487b] text-white text-xs font-bold rounded-lg hover:bg-[#00719f] shadow-md">
                        📹 Buka Kelas Virtual (Zoom/LMS)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-base">Pengumuman Akademik</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Penting</span>
                      <h4 className="text-xs font-bold text-slate-800 mt-1">Batas Akhir Pengisian KRS</h4>
                      <p className="text-[10px] text-slate-600 mt-1">Harap ajukan KRS sebelum 20 Sep 2026.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KURIKULUM */}
          {activeTab === "kurikulum" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Kurikulum Program Studi S1 Informatika</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500">
                  Semester 1 - Semester 2
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {[
                    { code: "INF101", name: "Pemrograman Dasar", sks: 4, status: "Lulus" },
                    { code: "INF102", name: "Kalkulus I", sks: 3, status: "Lulus" },
                    { code: "INF103", name: "Struktur Data & Algoritma", sks: 4, status: "Lulus" },
                  ].map((c) => (
                    <div key={c.code} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-xs text-slate-500 pr-3">{c.code}</span>
                        <span className="font-bold text-slate-800">{c.name}</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-slate-400">{c.sks} SKS</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KRS */}
          {activeTab === "krs" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Form Pengisian KRS Semester 3</h2>
                  <p className="text-sm text-slate-500">Tentukan mata kuliah pilihan dan wajib untuk semester ini.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total SKS Terpilih</span>
                  <p className="text-2xl font-black text-[#0f487b]">
                    {krsCourses.filter((c) => selectedKrs.includes(c.id)).reduce((acc, c) => acc + c.sks, 0)} SKS
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500">
                  Pilihan Kelas Tersedia
                </div>
                <div className="divide-y divide-slate-100">
                  {krsCourses.map((c) => {
                    const selected = selectedKrs.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCourse(c.id)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                          selected ? "bg-blue-50/20" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selected ? "bg-[#0f487b] border-[#0f487b]" : "bg-white border-slate-300"
                            }`}
                          >
                            {selected && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Dosen: {c.lecturer} ({c.code})</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          {c.sks} SKS
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleKrsSubmit}
                disabled={selectedKrs.length === 0}
                className="w-full py-3 bg-[#0f487b] text-white hover:bg-[#00719f] font-bold rounded-xl text-sm transition-all shadow-md"
              >
                Kirim Pengajuan KRS ke Dosen PA
              </button>
            </div>
          )}

          {/* TAB 4: KHS */}
          {activeTab === "khs" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Kartu Hasil Studi (KHS) Semester Genap</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Mata Kuliah</th>
                      <th className="px-6 py-4 text-center">SKS</th>
                      <th className="px-6 py-4 text-center">Nilai Angka</th>
                      <th className="px-6 py-4 text-center">Nilas Huruf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-800">Pemrograman Berorientasi Objek</td>
                      <td className="px-6 py-4 text-center font-semibold">3</td>
                      <td className="px-6 py-4 text-center">92.00</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">A</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-800">Kalkulus II</td>
                      <td className="px-6 py-4 text-center font-semibold">3</td>
                      <td className="px-6 py-4 text-center">88.50</td>
                      <td className="px-6 py-4 text-center font-bold text-[#0f487b]">B+</td>
                    </tr>
                  </tbody>
                </table>
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
