"use client";

import React, { useState, useEffect } from "react";
import { useRole } from "../context/RoleContext";
import { LOGO_URL, INSTITUTION_SHORT_NAME } from "@/lib/client-config";

type DosenTab = "beranda" | "jadwal" | "nilai" | "krs_perwalian";

interface ClassData {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  capacity: number;
  enrolledCount: number;
  mode: string;
}

interface StudentGrade {
  gradeId: string | null;
  studentId: string;
  nim: string | null;
  fullName: string;
  tugasScore: string;
  utsScore: string;
  uasScore: string;
  finalScore: string;
  letterGrade: string | null;
  locked: boolean;
}

interface LecturerProfile {
  id: string;
  nidn: string;
  fullName: string;
  studyProgramName: string;
  bkdLoad: string;
}

export default function DosenPage() {
  const { user, logout, loading } = useRole();
  const [activeTab, setActiveTab] = useState<DosenTab>("beranda");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [toastMsg, setToastMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lecturer, setLecturer] = useState<LecturerProfile | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);

  // Advisor States
  interface KrsItemDetail {
    itemId: string;
    itemStatus: string;
    classId: string;
    className: string;
    courseCode: string;
    courseName: string;
    sks: number;
    courseType: string;
  }

  interface KrsDetails {
    id: string;
    status: string;
    totalSks: number;
    maxSksAllowed: number;
    submittedAt: string | null;
    items: KrsItemDetail[];
  }

  interface AdvisingStudent {
    studentId: string;
    nim: string | null;
    fullName: string;
    angkatan: number;
    currentSemester: number;
    academicStatus: string;
    ipk: string;
    totalSksLulus: number;
    studyProgramId: string;
    studyProgramName: string;
    krs: KrsDetails | null;
  }

  const [advisingStudents, setAdvisingStudents] = useState<AdvisingStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AdvisingStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [submittingKrs, setSubmittingKrs] = useState(false);

  useEffect(() => {
    fetchSchedule();
    fetchAdvising();
  }, []);

  const fetchAdvising = async () => {
    try {
      const res = await fetch("/api/dosen/perwalian");
      const data = await res.json();
      if (data.success) {
        setAdvisingStudents(data.students || []);
      }
    } catch {}
  };

  const handleKrsDecision = async (krsId: string, action: "approve" | "reject") => {
    if (action === "reject" && !rejectNote.trim()) {
      triggerToast("Catatan penolakan wajib diisi!");
      return;
    }

    setSubmittingKrs(true);
    try {
      const res = await fetch("/api/dosen/perwalian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          krsId,
          action,
          note: action === "reject" ? rejectNote : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(action === "approve" ? "KRS berhasil disetujui!" : "KRS berhasil ditolak.");
        setRejectNote("");
        
        // Refresh advising list and preserve selected student detail view
        const resRefresh = await fetch("/api/dosen/perwalian");
        const refreshData = await resRefresh.json();
        if (refreshData.success) {
          setAdvisingStudents(refreshData.students || []);
          if (selectedStudent) {
            const updated = refreshData.students.find((s: any) => s.studentId === selectedStudent.studentId);
            setSelectedStudent(updated || null);
          }
        }
      } else {
        triggerToast(data.error || "Gagal memproses keputusan KRS.");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setSubmittingKrs(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchGrades(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/dosen/schedule");
      const data = await res.json();
      if (data.success) {
        if (data.lecturer) setLecturer(data.lecturer);
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0 && !selectedClassId) {
            setSelectedClassId(data.classes[0].classId);
          }
        }
      }
    } catch {}
  };

  const fetchGrades = async (classId: string) => {
    try {
      const res = await fetch(`/api/dosen/grades?classId=${classId}`);
      const data = await res.json();
      if (data.success) {
        setGrades(data.grades || []);
      }
    } catch {}
  };

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

  const handleGradeChange = (studentId: string, field: "tugasScore" | "utsScore" | "uasScore", value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0)).toString();
    setGrades(prev => prev.map(g => {
      if (g.studentId === studentId) {
        const newG = { ...g, [field]: numValue };
        // Recalculate
        const total = (parseFloat(newG.tugasScore) * 0.3) + (parseFloat(newG.utsScore) * 0.3) + (parseFloat(newG.uasScore) * 0.4);
        let letter = "E";
        if (total >= 85) letter = "A";
        else if (total >= 80) letter = "A-";
        else if (total >= 75) letter = "B+";
        else if (total >= 70) letter = "B";
        else if (total >= 60) letter = "C";
        else if (total >= 50) letter = "D";
        return { ...newG, finalScore: total.toFixed(2), letterGrade: letter };
      }
      return g;
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch("/api/dosen/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          grades: grades.map(g => ({
            studentId: g.studentId,
            tugasScore: parseFloat(g.tugasScore),
            utsScore: parseFloat(g.utsScore),
            uasScore: parseFloat(g.uasScore),
            finalScore: parseFloat(g.finalScore),
            letterGrade: g.letterGrade,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || "Nilai berhasil disimpan!");
      } else {
        triggerToast(data.error || "Gagal menyimpan nilai");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const displayName = lecturer?.fullName || user?.name || "Dosen";
  const displayNidn = lecturer?.nidn || "-";
  const displayInitials = displayName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

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
          <img src={LOGO_URL} alt={`Logo ${INSTITUTION_SHORT_NAME}`} className="h-8 object-contain brightness-0 invert" />
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                {displayInitials}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">{displayName}</h3>
              <p className="text-[10px] text-white/60 font-bold mt-0.5 tracking-wider font-mono">NIDN: {displayNidn}</p>
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
                <h2 className="text-xl font-bold">Selamat Datang Kembali, {displayName}</h2>
                <p className="text-xs text-white/70 max-w-lg">Sistem Informasi Akademik terintegrasi {INSTITUTION_SHORT_NAME}. Kelola absensi mahasiswa, persetujuan KRS perwalian, dan input nilai akhir semester secara mandiri di sini.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">📅</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kelas Diampu</h3>
                  <p className="text-sm font-bold text-slate-800">{classes.length} Kelas</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">🤝</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Mahasiswa</h3>
                  <p className="text-sm font-bold text-slate-800">{classes.reduce((a, c) => a + c.enrolledCount, 0)} Orang</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">BKD Semester</h3>
                  <p className="text-sm font-bold text-slate-800">{lecturer?.bkdLoad || "0"} SKS</p>
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
                {classes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">Belum ada jadwal mengajar untuk periode ini.</div>
                ) : classes.map((cls) => (
                  <div key={cls.classId} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0f487b]">{cls.courseCode}</span>
                        <span className="text-[9px] bg-slate-150 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{cls.className}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{cls.courseName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{cls.sks} SKS • {cls.mode}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Jumlah Mahasiswa</span>
                      <span className="text-sm font-bold text-slate-700">{cls.enrolledCount} / {cls.capacity}</span>
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
                      {classes.map(cls => (
                        <option key={cls.classId} value={cls.classId}>{cls.courseName} ({cls.courseCode})</option>
                      ))}
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
                      {grades.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Belum ada mahasiswa terdaftar di kelas ini.</td></tr>
                      ) : grades.map((student) => (
                        <tr key={student.studentId} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-mono text-slate-500">{student.nim || "-"}</td>
                          <td className="py-3 font-bold text-slate-700">{student.fullName}</td>
                          <td className="py-2 text-center">
                            <input type="number" value={parseInt(student.tugasScore)} onChange={(e) => handleGradeChange(student.studentId, "tugasScore", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-2 text-center">
                            <input type="number" value={parseInt(student.utsScore)} onChange={(e) => handleGradeChange(student.studentId, "utsScore", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-2 text-center">
                            <input type="number" value={parseInt(student.uasScore)} onChange={(e) => handleGradeChange(student.studentId, "uasScore", e.target.value)} className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded outline-none focus:border-[#0f487b]" />
                          </td>
                          <td className="py-3 text-center font-black text-[#0f487b]">{student.letterGrade || "-"}</td>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl fade-in">
              {/* Advising Student List */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-[600px]">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Mahasiswa Bimbingan</h3>
                  <p className="text-[11px] text-slate-400">Total bimbingan aktif: {advisingStudents.length}</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NIM..."
                    className="w-full text-xs pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0f487b] transition-all"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">🔍</span>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {advisingStudents.filter(s => 
                    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (s.nim && s.nim.includes(searchQuery))
                  ).length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-bold">
                      Tidak ada data mahasiswa bimbingan.
                    </div>
                  ) : (
                    advisingStudents
                      .filter(s => 
                        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (s.nim && s.nim.includes(searchQuery))
                      )
                      .map((student) => {
                        const isSelected = selectedStudent?.studentId === student.studentId;
                        const status = student.krs?.status;
                        
                        let badgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                        let badgeText = "Belum Mengajukan";
                        
                        if (status === "diajukan") {
                          badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                          badgeText = "Menunggu PA";
                        } else if (status === "disetujui_pa") {
                          badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                          badgeText = "Disetujui";
                        } else if (status === "ditolak") {
                          badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
                          badgeText = "Ditolak";
                        }

                        return (
                          <button
                            key={student.studentId}
                            onClick={() => {
                              setSelectedStudent(student);
                              setRejectNote("");
                            }}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                              isSelected
                                ? "border-[#0f487b] bg-blue-50/50"
                                : "border-slate-100 hover:border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <span className="font-bold text-slate-800 text-xs truncate max-w-[130px]">
                                {student.fullName}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                {badgeText}
                              </span>
                            </div>
                            <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-mono">
                              <span>{student.nim || "Calon Mhs"}</span>
                              <span>Semester {student.currentSemester}</span>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Student Detail Pane */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[600px] overflow-hidden">
                {selectedStudent ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FED524]/20 border-2 border-[#FED524]/30 flex items-center justify-center font-bold text-[#0f487b] text-base shrink-0">
                          {selectedStudent.fullName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{selectedStudent.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            NIM: {selectedStudent.nim || "Belum Terbit"} • {selectedStudent.studyProgramName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">IPK Kumulatif</span>
                        <span className="text-lg font-black text-[#0f487b]">{selectedStudent.ipk || "0.00"}</span>
                      </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Semester</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStudent.currentSemester}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Angkatan</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStudent.angkatan}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">SKS Lulus</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStudent.totalSksLulus}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Status KRS</span>
                          <span className="text-[10px] font-bold text-[#0f487b] capitalize mt-0.5 block">
                            {selectedStudent.krs?.status.replace("_pa", "").replace("disetujui", "Disetujui").replace("ditolak", "Ditolak") || "Draft"}
                          </span>
                        </div>
                      </div>

                      {/* KRS Section */}
                      {selectedStudent.krs ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Mata Kuliah Yang Diajukan
                            </h5>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedStudent.krs.totalSks} SKS / Max {selectedStudent.krs.maxSksAllowed} SKS
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                            {selectedStudent.krs.items.map((item) => (
                              <div key={item.itemId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors bg-white">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-[#0f487b]">{item.courseCode}</span>
                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{item.className}</span>
                                  </div>
                                  <h6 className="text-xs font-bold text-slate-800 mt-1">{item.courseName}</h6>
                                </div>
                                <span className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-slate-500 font-bold">
                                  {item.sks} SKS
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Rejection comment display if already rejected */}
                          {selectedStudent.krs.status === "ditolak" && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Catatan Penolakan</span>
                              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                                Silakan sesuaikan mata kuliah sesuai saran Pembimbing Akademik.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400 text-xs font-bold">
                          Mahasiswa ini belum menyusun rencana studi untuk semester berjalan.
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    {selectedStudent.krs && selectedStudent.krs.status === "diajukan" && (
                      <div className="border-t border-slate-100 pt-4 shrink-0 space-y-3">
                        <textarea
                          rows={2}
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Tulis catatan penolakan di sini (wajib diisi apabila menolak KRS)..."
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-rose-500 transition-all resize-none"
                        />
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => handleKrsDecision(selectedStudent.krs!.id, "reject")}
                            disabled={submittingKrs || !rejectNote.trim()}
                            className={`px-6 py-2.5 rounded-xl font-bold text-xs border text-center transition-all ${
                              rejectNote.trim() && !submittingKrs
                                ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-md"
                                : "bg-slate-55 border-slate-200 text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            {submittingKrs ? "Memproses..." : "Tolak KRS"}
                          </button>
                          <button
                            onClick={() => handleKrsDecision(selectedStudent.krs!.id, "approve")}
                            disabled={submittingKrs}
                            className={`px-6 py-2.5 rounded-xl font-bold text-xs bg-[#0f487b] border border-[#0f487b] text-white hover:bg-[#00719f] transition-all shadow-md cursor-pointer`}
                          >
                            {submittingKrs ? "Memproses..." : "Setujui KRS"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-2">
                    <span className="text-3xl">💡</span>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400">Persetujuan Perwalian</h5>
                    <p className="text-[11px] max-w-xs leading-relaxed">
                      Silakan pilih salah satu mahasiswa bimbingan di panel sebelah kiri untuk meninjau dan memproses Kartu Rencana Studi (KRS) mereka.
                    </p>
                  </div>
                )}
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
