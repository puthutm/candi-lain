"use client";

import { useState, useEffect } from "react";
import StudentSidebar, { TabType } from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";

// Tab Components
import DashboardTab from "./components/tabs/DashboardTab";
import KurikulumTab from "./components/tabs/KurikulumTab";
import KrsTab from "./components/tabs/KrsTab";
import KhsTab from "./components/tabs/KhsTab";
import LayananTab from "./components/tabs/LayananTab";

export interface StudentProfile {
  id: string;
  nim: string | null;
  fullName: string;
  studyProgramName: string;
  angkatan: number;
  currentSemester: number;
  academicStatus: string;
  ipk: string;
  totalSksLulus: number;
  dosenPaName: string;
}

export interface KrsCourse {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  courseType: string;
  capacity?: number;
  enrolledCount?: number;
  itemStatus?: string;
}

export default function RegularStudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedKrs, setSelectedKrs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [krsCourses, setKrsCourses] = useState<KrsCourse[]>([]);
  const [availableClasses, setAvailableClasses] = useState<KrsCourse[]>([]);
  const [krsStatus, setKrsStatus] = useState<string | null>(null);
  const [periodName, setPeriodName] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    fetchProfile();
    fetchKrs();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/student/profile");
      const data = await res.json();
      if (data.success && data.student) {
        setStudent(data.student);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKrs = async () => {
    try {
      const res = await fetch("/api/student/krs");
      const data = await res.json();
      if (data.success) {
        setKrsStatus(data.krsStatus);
        setKrsCourses(data.courses || []);
        setAvailableClasses(data.availableClasses || []);
        setPeriodName(data.academicPeriod?.name || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitKrs = async () => {
    if (selectedKrs.length === 0) {
      triggerToast("Pilih setidaknya 1 mata kuliah.");
      return;
    }
    try {
      const res = await fetch("/api/student/krs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classIds: selectedKrs }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("KRS berhasil diajukan ke Dosen PA!");
        fetchKrs();
      } else {
        triggerToast("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Component */}
      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        studentName={student?.fullName || "Budi Santoso"}
        studentNim={student?.nim || "26090182"}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Header Component */}
        <StudentHeader
          setIsSidebarOpen={setIsSidebarOpen}
          studentName={student?.fullName || "Budi Santoso"}
          periodName={periodName}
        />

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {activeTab === "dashboard" && (
            <DashboardTab
              student={student}
              krsStatus={krsStatus}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "kurikulum" && <KurikulumTab />}

          {activeTab === "krs" && (
            <KrsTab
              availableClasses={availableClasses}
              selectedKrs={selectedKrs}
              setSelectedKrs={setSelectedKrs}
              handleSubmitKrs={handleSubmitKrs}
              krsCourses={krsCourses}
              krsStatus={krsStatus}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "khs" && <KhsTab triggerToast={triggerToast} />}

          {activeTab === "layanan" && <LayananTab triggerToast={triggerToast} />}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f487b] text-white border border-blue-400 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-[#FED524]">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
