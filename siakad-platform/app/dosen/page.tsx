"use client";

import { useState, useEffect } from "react";
import { useRole } from "../context/RoleContext";
import DosenSidebar, { DosenTab } from "./components/DosenSidebar";
import DosenHeader from "./components/DosenHeader";

// Tab Components
import BerandaTab from "./components/tabs/BerandaTab";
import JadwalTab from "./components/tabs/JadwalTab";
import NilaiTab from "./components/tabs/NilaiTab";
import KrsPerwalianTab from "./components/tabs/KrsPerwalianTab";

export interface ClassData {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  capacity: number;
  enrolledCount: number;
  mode: string;
}

export interface StudentGrade {
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

export interface LecturerProfile {
  id: string;
  nidn: string;
  fullName: string;
  studyProgramName: string;
  bkdLoad: string;
}

export interface KrsItemDetail {
  itemId: string;
  itemStatus: string;
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  courseType: string;
}

export interface KrsSubmissionDetail {
  krsId: string;
  studentId: string;
  studentName: string;
  nim: string;
  totalSks: number;
  items: KrsItemDetail[];
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
  const [submissions, setSubmissions] = useState<KrsSubmissionDetail[]>([]);
  const [selectedSub, setSelectedSub] = useState<KrsSubmissionDetail | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetchLecturerData();
  }, []);

  const fetchLecturerData = async () => {
    try {
      const res = await fetch("/api/dosen/overview");
      const data = await res.json();
      if (data.success && data.data) {
        setLecturer(data.data.lecturer);
        setClasses(data.data.classes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "krs_perwalian") {
      fetchKrsSubmissions();
    }
  }, [activeTab]);

  const fetchKrsSubmissions = async () => {
    try {
      const res = await fetch("/api/dosen/krs-approval");
      const data = await res.json();
      if (data.success && data.submissions) {
        setSubmissions(data.submissions);
        if (data.submissions.length > 0 && !selectedSub) {
          setSelectedSub(data.submissions[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchGradesForClass(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchGradesForClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/dosen/grades?classId=${classId}`);
      const data = await res.json();
      if (data.success && data.grades) {
        setGrades(data.grades);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGradeChange = (
    index: number,
    field: "tugasScore" | "utsScore" | "uasScore",
    val: string
  ) => {
    const updated = [...grades];
    updated[index][field] = val;

    const tugas = parseFloat(updated[index].tugasScore) || 0;
    const uts = parseFloat(updated[index].utsScore) || 0;
    const uas = parseFloat(updated[index].uasScore) || 0;
    const finalVal = tugas * 0.2 + uts * 0.3 + uas * 0.5;
    updated[index].finalScore = finalVal.toFixed(1);

    let letter = "E";
    if (finalVal >= 85) letter = "A";
    else if (finalVal >= 80) letter = "A-";
    else if (finalVal >= 75) letter = "B+";
    else if (finalVal >= 70) letter = "B";
    else if (finalVal >= 65) letter = "B-";
    else if (finalVal >= 60) letter = "C+";
    else if (finalVal >= 55) letter = "C";
    else if (finalVal >= 40) letter = "D";

    updated[index].letterGrade = letter;
    setGrades(updated);
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch("/api/dosen/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          grades: grades.map((g) => ({
            studentId: g.studentId,
            tugasScore: g.tugasScore,
            utsScore: g.utsScore,
            uasScore: g.uasScore,
            finalScore: g.finalScore,
            letterGrade: g.letterGrade,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Draft nilai berhasil disimpan!");
        fetchGradesForClass(selectedClassId);
      } else {
        triggerToast("Gagal menyimpan: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  const handleLockGrades = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch("/api/dosen/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          lock: true,
          grades: grades.map((g) => ({
            studentId: g.studentId,
            tugasScore: g.tugasScore,
            utsScore: g.utsScore,
            uasScore: g.uasScore,
            finalScore: g.finalScore,
            letterGrade: g.letterGrade,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Nilai berhasil dipublikasikan & KHS dikunci!");
        fetchGradesForClass(selectedClassId);
      } else {
        triggerToast("Gagal mengunci nilai: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  const handleKrsApprove = async (krsId: string, name: string) => {
    try {
      const res = await fetch("/api/dosen/krs-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS Perwalian ${name} berhasil disetujui (Approved)`);
        setSelectedSub(null);
        setRejectNote("");
        fetchKrsSubmissions();
      } else {
        triggerToast("Gagal menyetujui KRS: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  const handleKrsReject = async (krsId: string, name: string) => {
    if (!rejectNote) {
      triggerToast("Catatan penolakan wajib diisi");
      return;
    }
    try {
      const res = await fetch("/api/dosen/krs-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId, action: "reject", note: rejectNote }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS ${name} ditolak (Rejected) dengan catatan: ${rejectNote}`);
        setSelectedSub(null);
        setRejectNote("");
        fetchKrsSubmissions();
      } else {
        triggerToast("Gagal menolak KRS: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-[#0f487b]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent border-[#0f487b] rounded-full animate-spin"></div>
          <span className="font-bold text-xs">Memuat Portal Dosen SIAKAD...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Component */}
      <DosenSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        lecturerName={user?.name || lecturer?.fullName || "Dr. Aulia Rahman, M.Kom."}
        lecturerNidn={lecturer?.nidn || "0421098501"}
        submissionsCount={submissions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Header Component */}
        <DosenHeader
          setIsSidebarOpen={setIsSidebarOpen}
          lecturerName={user?.name || lecturer?.fullName || "Dr. Aulia Rahman, M.Kom."}
          logout={logout}
        />

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {activeTab === "beranda" && (
            <BerandaTab
              lecturer={lecturer}
              classes={classes}
              submissionsCount={submissions.length}
            />
          )}

          {activeTab === "jadwal" && (
            <JadwalTab classes={classes} triggerToast={triggerToast} />
          )}

          {activeTab === "nilai" && (
            <NilaiTab
              classes={classes}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              grades={grades}
              handleGradeChange={handleGradeChange}
              handleSaveGrades={handleSaveGrades}
              handleLockGrades={handleLockGrades}
            />
          )}

          {activeTab === "krs_perwalian" && (
            <KrsPerwalianTab
              submissions={submissions}
              selectedSub={selectedSub}
              setSelectedSub={setSelectedSub}
              rejectNote={rejectNote}
              setRejectNote={setRejectNote}
              handleKrsApprove={handleKrsApprove}
              handleKrsReject={handleKrsReject}
            />
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f487b] text-white border border-blue-400 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-[#FED524]">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
