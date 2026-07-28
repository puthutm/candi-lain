"use client";

import React, { useState, useEffect } from "react";
import { useRole } from "../context/RoleContext";
import StudentLmsSidebar, { LmsStudentTab } from "./components/StudentLmsSidebar";
import StudentLmsHeader from "./components/StudentLmsHeader";

// Tab Components
import StudentClassesTab from "./components/tabs/StudentClassesTab";
import StudentSessionsTab from "./components/tabs/StudentSessionsTab";
import StudentMaterialsTab from "./components/tabs/StudentMaterialsTab";
import StudentViconTab from "./components/tabs/StudentViconTab";

export interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
}

export interface LMSSession {
  id: string;
  sessionNumber: number;
  topic: string;
  description: string;
}

export interface LMSMaterial {
  id: string;
  title: string;
  materialType: string;
  fileUrl: string;
}

export interface ViconDetails {
  id: string;
  sessionId: string;
  title: string;
  meetingLink: string;
  durationMinutes: number;
}

export default function StudentLMSDashboard() {
  const { user } = useRole();
  const studentUserId = user?.username || "26090182";
  const studentName = user?.name || "Budi Santoso";

  const [activeTab, setActiveTab] = useState<LmsStudentTab>("classes");
  const [classes, setClasses] = useState<LMSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LMSClass | null>(null);
  const [sessions, setSessions] = useState<LMSSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LMSSession | null>(null);
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);

  // Vicon & Presence simulation states
  const [vicon, setVicon] = useState<ViconDetails | null>(null);
  const [isMeetingJoined, setIsMeetingJoined] = useState(false);
  const [attendanceLog, setAttendanceLog] = useState<any>(null);

  // Form states
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<string>("belum_dikerjakan");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchEnrolledClasses();
  }, []);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchEnrolledClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      showMsg("Gagal memuat daftar kelas", "error");
    }
  };

  const handleSelectClass = async (cls: LMSClass) => {
    setSelectedClass(cls);
    setSelectedSession(null);
    setMaterials([]);
    setVicon(null);
    setIsMeetingJoined(false);

    try {
      const res = await fetch(`/api/sessions?classId=${cls.id}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (err) {
      showMsg("Gagal memuat sesi kuliah", "error");
    }
  };

  const handleSelectSession = async (sess: LMSSession) => {
    setSelectedSession(sess);
    setAssignmentAnswer("");
    setSubmissionStatus("belum_dikerjakan");
    setIsMeetingJoined(false);
    setAttendanceLog(null);

    try {
      const resMat = await fetch(`/api/materials?sessionId=${sess.id}`);
      const dataMat = await resMat.json();
      if (dataMat.success) setMaterials(dataMat.materials);

      const resVic = await fetch(`/api/vicon?sessionId=${sess.id}`);
      const dataVic = await resVic.json();
      if (dataVic.success) setVicon(dataVic.vicon);
      else setVicon(null);
    } catch (err) {
      showMsg("Gagal memuat rincian sesi", "error");
    }
  };

  const handleJoinVicon = async () => {
    if (!vicon || !selectedSession || !selectedClass) return;

    try {
      const res = await fetch("/api/vicon/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viconId: vicon.id,
          studentUserId,
          classId: selectedClass.id,
          sessionId: selectedSession.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsMeetingJoined(true);
        setAttendanceLog(data.attendance);
        showMsg("Kehadiran berhasil dicatat secara otomatis!", "success");
        window.open(vicon.meetingLink, "_blank");
      } else {
        showMsg("Gagal mencatat presensi: " + data.error, "error");
      }
    } catch (err: any) {
      showMsg("Galat: " + err.message, "error");
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          studentUserId,
          submissionUrl: assignmentAnswer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionStatus("sudah_dikirim");
        showMsg("Tugas berhasil dikirim!", "success");
      } else {
        showMsg("Gagal mengirim tugas: " + data.error, "error");
      }
    } catch (err: any) {
      showMsg("Galat: " + err.message, "error");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Component */}
      <StudentLmsSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        classesCount={classes.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <StudentLmsHeader
          studentName={studentName}
          studentUserId={studentUserId}
        />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "classes" && (
            <StudentClassesTab
              classes={classes}
              selectedClass={selectedClass}
              handleSelectClass={handleSelectClass}
            />
          )}

          {activeTab === "sessions" && (
            <StudentSessionsTab
              selectedClass={selectedClass}
              sessions={sessions}
              selectedSession={selectedSession}
              handleSelectSession={handleSelectSession}
            />
          )}

          {activeTab === "materials" && (
            <StudentMaterialsTab
              selectedSession={selectedSession}
              materials={materials}
              assignmentAnswer={assignmentAnswer}
              setAssignmentAnswer={setAssignmentAnswer}
              submissionStatus={submissionStatus}
              handleSubmitAssignment={handleSubmitAssignment}
            />
          )}

          {activeTab === "vicon" && (
            <StudentViconTab
              selectedSession={selectedSession}
              vicon={vicon}
              isMeetingJoined={isMeetingJoined}
              attendanceLog={attendanceLog}
              handleJoinVicon={handleJoinVicon}
            />
          )}
        </main>
      </div>

      {/* Toast Notice */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up ${
            message.type === "success" ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
