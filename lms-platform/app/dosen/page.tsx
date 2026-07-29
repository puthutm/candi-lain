"use client";

import React, { useState, useEffect } from "react";
import DosenLmsSidebar, { LmsDosenTab } from "./components/DosenLmsSidebar";
import DosenLmsHeader from "./components/DosenLmsHeader";

// Tab Components
import ClassesTab from "./components/tabs/ClassesTab";
import SessionsTab from "./components/tabs/SessionsTab";
import MaterialsTab from "./components/tabs/MaterialsTab";
import ViconTab from "./components/tabs/ViconTab";

export interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
  dosenUserId: string;
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
  verificationStatus: string;
  revisionNote: string | null;
}

export default function DosenDashboard() {
  const [activeTab, setActiveTab] = useState<LmsDosenTab>("classes");
  const [classes, setClasses] = useState<LMSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LMSClass | null>(null);
  const [sessions, setSessions] = useState<LMSSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LMSSession | null>(null);
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);

  // Vicon details
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [viconStatus, setViconStatus] = useState<string>("");

  // Form states
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState("dokumen");
  const [materialUrl, setMaterialUrl] = useState("");

  // Verification states
  const [verifierRole, setVerifierRole] = useState<"prodi" | "bpm">("prodi");
  const [verifyStatus, setVerifyStatus] = useState<"setuju" | "revisi">("setuju");
  const [verifyNote, setVerifyNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      showMsg("Gagal memuat daftar kelas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls: LMSClass) => {
    setSelectedClass(cls);
    setSelectedSession(null);
    setMaterials([]);
    setViconStatus("");

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
    fetchMaterials(sess.id);
  };

  const fetchMaterials = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/materials?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      showMsg("Gagal memuat materi", "error");
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          title: materialTitle,
          materialType,
          fileUrl: materialUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Materi berhasil diunggah!", "success");
        setMaterialTitle("");
        setMaterialUrl("");
        fetchMaterials(selectedSession.id);
      } else {
        showMsg("Gagal mengunggah materi: " + data.error, "error");
      }
    } catch (err: any) {
      showMsg("Galat: " + err.message, "error");
    }
  };

  const handleVerifyMaterial = async (materialId: string) => {
    try {
      const res = await fetch("/api/materials/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          verifierRole,
          status: verifyStatus,
          revisionNote: verifyNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`Verifikasi materi (${verifyStatus}) berhasil disimpan!`, "success");
        if (selectedSession) fetchMaterials(selectedSession.id);
      } else {
        showMsg("Gagal verifikasi: " + data.error, "error");
      }
    } catch (err: any) {
      showMsg("Galat: " + err.message, "error");
    }
  };

  const handleCreateVicon = async () => {
    if (!selectedSession) return;
    try {
      const res = await fetch("/api/vicon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          title: `Vicon Sesi ${selectedSession.sessionNumber}: ${selectedSession.topic}`,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setViconStatus(`Vicon Room Aktif! URL Meeting: ${data.vicon.meetingLink}`);
        showMsg("Ruang Vicon berhasil diaktifkan!", "success");
      } else {
        showMsg("Gagal membuat Vicon: " + data.error, "error");
      }
    } catch (err: any) {
      showMsg("Galat: " + err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Memuat LMS Dosen Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Component */}
      <DosenLmsSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        classesCount={classes.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header Component */}
        <DosenLmsHeader />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === "classes" && (
            <ClassesTab
              classes={classes}
              selectedClass={selectedClass}
              handleSelectClass={handleSelectClass}
            />
          )}

          {activeTab === "sessions" && (
            <SessionsTab
              selectedClass={selectedClass}
              sessions={sessions}
              selectedSession={selectedSession}
              handleSelectSession={handleSelectSession}
              showMsg={showMsg}
            />
          )}

          {activeTab === "materials" && (
            <MaterialsTab
              selectedSession={selectedSession}
              materials={materials}
              materialTitle={materialTitle}
              setMaterialTitle={setMaterialTitle}
              materialType={materialType}
              setMaterialType={setMaterialType}
              materialUrl={materialUrl}
              setMaterialUrl={setMaterialUrl}
              handleCreateMaterial={handleCreateMaterial}
              verifierRole={verifierRole}
              setVerifierRole={setVerifierRole}
              verifyStatus={verifyStatus}
              setVerifyStatus={setVerifyStatus}
              verifyNote={verifyNote}
              setVerifyNote={setVerifyNote}
              handleVerifyMaterial={handleVerifyMaterial}
            />
          )}

          {activeTab === "vicon" && (
            <ViconTab
              selectedSession={selectedSession}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
              viconStatus={viconStatus}
              handleCreateVicon={handleCreateVicon}
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
