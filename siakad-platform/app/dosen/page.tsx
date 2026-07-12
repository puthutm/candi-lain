"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRole } from "../context/RoleContext";

type DosenTab = "beranda" | "jadwal" | "nilai" | "krs_perwalian";

interface ClassSchedule {
  id: string;
  code: string;
  name: string;
  sks: number;
  room: string;
  time: string;
  studentCount: number;
}

interface StudentGrade {
  nim: string;
  name: string;
  tugas: number;
  uts: number;
  uas: number;
  finalGrade: string;
}

export default function DosenPage() {
  const { user, logout, loading } = useRole();
  const [activeTab, setActiveTab] = useState<DosenTab>("beranda");
  const [selectedClassId, setSelectedClassId] = useState<string>("inf202");
  const [toastMsg, setToastMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock schedule
  const schedules: ClassSchedule[] = [
    { id: "inf101", code: "INF101", name: "Pemrograman Dasar", sks: 4, room: "Vicon Class A", time: "Senin, 08:00 - 11:30", studentCount: 42 },
    { id: "inf202", code: "INF202", name: "Basis Data Terdistribusi", sks: 3, room: "Vicon Class B", time: "Selasa, 13:00 - 15:30", studentCount: 38 },
    { id: "inf203", code: "INF203", name: "Kecerdasan Buatan", sks: 3, room: "Vicon Class C", time: "Kamis, 10:00 - 12:30", studentCount: 40 },
  ];

  // Mock students grades for input
  const [grades, setGrades] = useState<Record<string, StudentGrade[]>>({
    inf202: [
      { nim: "26090011", name: "Andi Wijaya", tugas: 80, uts: 75, uas: 85, finalGrade: "A-" },
      { nim: "26090182", name: "Budi Santoso", tugas: 90, uts: 85, uas: 88, finalGrade: "A" },
      { nim: "26090045", name: "Citra Lestari", tugas: 70, uts: 70, uas: 75, finalGrade: "B" },
    ],
    inf101: [
      { nim: "26090200", name: "Dani Ramadhan", tugas: 85, uts: 80, uas: 90, finalGrade: "A" },
      { nim: "26090311", name: "Elisa Fitri", tugas: 60, uts: 65, uas: 70, finalGrade: "C" },
    ]
  });

  const handleGradeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        triggerToast("CSV kosong atau format salah!");
        return;
      }
      triggerToast(`Berhasil mengimpor ${lines.length - 1} nilai mahasiswa dari CSV!`);
    };
    reader.readAsText(file);
  };

  const handleGradeChange = (classId: string, studentNim: string, field: "tugas" | "uts" | "uas", value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setGrades(prev => {
      const classGrades = prev[classId] || [];
      const updatedClassGrades = classGrades.map(g => {
        if (g.nim === studentNim) {
          const newG = { ...g, [field]: numValue };
          // Recalculate final grade
          const total = (newG.tugas * 0.3) + (newG.uts * 0.3) + (newG.uas * 0.4);
          let gradeLetter = "E";
          if (total >= 85) gradeLetter = "A";
          else if (total >= 80) gradeLetter = "A-";
          else if (total >= 75) gradeLetter = "B+";
          else if (total >= 70) gradeLetter = "B";
          else if (total >= 60) gradeLetter = "C";
          else if (total >= 50) gradeLetter = "D";
          return { ...newG, finalGrade: gradeLetter };
        }
        return g;
      });
      return { ...prev, [classId]: updatedClassGrades };
    });
  };

  const handleSaveGrades = () => {
    triggerToast("Nilai perkuliahan berhasil disimpan ke SIAKAD!");
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#0a345c] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:relative inset-y-0 left-0 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <img src="https://unsia.ac.id/wp-content/uploads/2022/11/LOGO-UNSIA-1.png" alt="Logo UNSIA" className="h-8 object-contain brightness-0 invert" />
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                DS
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">{user?.name || "Dr. Hendra Setiawan"}</h3>
              <p className="text-[10px] text-white/60 font-bold mt-0.5 tracking-wider font-mono">NIDN: 0428058203</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Menu Dosen</p>

          <button onClick={() => { setActiveTab("beranda"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
            activeTab === "beranda" ? "bg-white/15 text-white font-bold border border-white/20" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}>
            <span>🏠</span> Beranda Dosen
          </button>

          <button onClick={() => { setActiveTab("jadwal"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
            activeTab === "jadwal" ? "bg-white/15 text-white font-bold border border-white/20" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}>
            <span>📅</span> Jadwal Mengajar
          </button>

          <button onClick={() => { setActiveTab("nilai"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
            activeTab === "nilai" ? "bg-white/15 text-white font-bold border border-white/20" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}>
            <span>📝</span> Input Nilai Kuliah
          </button>

          <button onClick={() => { setActiveTab("krs_perwalian"); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
            activeTab === "krs_perwalian" ? "bg-white/15 text-white font-bold border border-white/20" : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}>
            <span>🤝</span> Perwalian KRS
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-500/35 hover:bg-rose-500/10 text-rose-400 font-bold text-xs rounded-xl transition duration-150 cursor-pointer">
            🚪 Keluar SIAKAD
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 lg:px-8">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 lg:hidden hover:bg-slate-100 rounded-lg">
            ☰
          </button>
          <div className="flex-1 flex items-center justify-between ml-4 lg:ml-0">
            <h2 className="text-lg font-bold text-slate-800">SIAKAD Dosen Portal</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-[#FED524]/20 text-[#0f487b] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Tahun Akademik: 2026/2027 Ganjil
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar bg-slate-50">
          
          {/* TAB 1: BERANDA DOSEN */}
          {activeTab === "beranda" && (
            <div className="flex flex-col gap-6 max-w-5xl">
              <div className="bg-gradient-to-br from-[#0f487b] to-[#0a345c] text-white p-8 rounded-3xl shadow-xl flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-xl font-bold">Selamat Datang Kembali, {user?.name || "Dr. Hendra Setiawan"}</h2>
                <p className="text-xs text-white/70 max-w-lg">Sistem Informasi Akademik terintegrasi UNSIA. Kelola absensi mahasiswa, persetujuan KRS perwalian, dan input nilai akhir semester secara mandiri di sini.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">📅</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jadwal Hari Ini</h3>
                  <p className="text-sm font-bold text-slate-800">1 Kelas Mengajar</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">🤝</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bimbingan KRS</h3>
                  <p className="text-sm font-bold text-slate-800">3 Mahasiswa Menunggu</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">BKD Semester</h3>
                  <p className="text-sm font-bold text-slate-800">12 SKS Terpenuhi</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JADWAL MENGAJAR */}
          {activeTab === "jadwal" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-5xl flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Jadwal Mengajar</h3>
                <p className="text-xs text-slate-400">Daftar mata kuliah yang diampu semester ini</p>
              </div>
              <div className="divide-y divide-slate-100">
                {schedules.map((sched) => (
                  <div key={sched.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0f487b]">{sched.code}</span>
                        <span className="text-[9px] bg-slate-150 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{sched.room}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{sched.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{sched.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Jumlah Mahasiswa</span>
                      <span className="text-sm font-bold text-slate-700">{sched.studentCount} Orang</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INPUT NILAI */}
          {activeTab === "nilai" && (
            <div className="flex flex-col gap-6 max-w-5xl">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Input Nilai Kuliah</h3>
                    <p className="text-xs text-slate-400">Pilih mata kuliah untuk menginput nilai semester</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none">
                      <option value="inf202">Basis Data Terdistribusi (INF202)</option>
                      <option value="inf101">Pemrograman Dasar (INF101)</option>
                    </select>
                    <label className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer text-center">
                      📥 Import Nilai (CSV)
                      <input type="file" accept=".csv" onChange={handleGradeImport} className="hidden" />
                    </label>
                    <button onClick={handleSaveGrades} className="px-4 py-2 bg-[#0f487b] hover:bg-[#0f487b]/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#0f487b]/15 transition">
                      Simpan Nilai
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="pb-3">NIM</th>
                        <th className="pb-3">Nama Mahasiswa</th>
                        <th className="pb-3 text-center">Tugas (30%)</th>
                        <th className="pb-3 text-center">UTS (30%)</th>
                        <th className="pb-3 text-center">UAS (40%)</th>
                        <th className="pb-3 text-center">Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(grades[selectedClassId] || []).map((student) => (
                        <tr key={student.nim} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-mono text-slate-500">{student.nim}</td>
                          <td className="py-3 font-bold text-slate-700">{student.name}</td>
                          <td className="py-2 text-center">
                            <input type="number" value={student.tugas} onChange={(e) => handleGradeChange(selectedClassId, student.nim, "tugas", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-2 text-center">
                            <input type="number" value={student.uts} onChange={(e) => handleGradeChange(selectedClassId, student.nim, "uts", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-2 text-center">
                            <input type="number" value={student.uas} onChange={(e) => handleGradeChange(selectedClassId, student.nim, "uas", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-3 text-center font-black text-[#0f487b]">{student.finalGrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERWALIAN KRS */}
          {activeTab === "krs_perwalian" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-5xl flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Perwalian KRS</h3>
                <p className="text-xs text-slate-400">Persetujuan rencana studi mahasiswa bimbingan</p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Budi Santoso</h4>
                    <p className="text-xs text-slate-400 font-mono">NIM: 26090182 | IPK: 3.82</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Status Keuangan: Lunas (UKT)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => triggerToast("KRS Budi Santoso disetujui!")} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition">
                      Setujui KRS
                    </button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition">
                      Lihat Rincian
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2">
          <span>✨</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
