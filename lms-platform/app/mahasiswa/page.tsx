"use client";

import React, { useState, useEffect } from "react";

interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
}

interface LMSSession {
  id: string;
  sessionNumber: number;
  topic: string;
  description: string;
}

interface LMSMaterial {
  id: string;
  title: string;
  materialType: string;
  fileUrl: string;
}

interface ViconDetails {
  id: string;
  title: string;
  meetingLink: string;
  durationMinutes: number;
}

export default function StudentDashboard() {
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

  // Seeded student ID (e.g. Budi Santoso)
  const studentUserId = "26090182";

  useEffect(() => {
    fetchEnrolledClasses();
  }, []);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchEnrolledClasses = async () => {
    try {
      // Find classes from the classes list. For simplicity and to test, let's load all classes.
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      showMsg("Gagal memuat daftar kelas", "error");
    } finally {
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
    setIsMeetingJoined(false);
    setVicon(null);
    setAttendanceLog(null);

    // 1. Fetch materials (Student role gets only published "terbit" materials)
    try {
      const res = await fetch(`/api/materials?sessionId=${sess.id}&role=mahasiswa`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      showMsg("Gagal memuat materi", "error");
    }

    // 2. Fetch Jitsi Meeting if scheduled
    try {
      const res = await fetch(`/api/vicon/active?sessionId=${sess.id}`);
      const data = await res.json();
      if (data.success && data.vicon) {
        setVicon(data.vicon);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinVicon = async () => {
    if (!vicon) return;
    try {
      const res = await fetch("/api/vicon/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentUserId,
          videoConferenceId: vicon.id,
          action: "join",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsMeetingJoined(true);
        setAttendanceLog(data.result.joinedLog);
        showMsg("Berhasil bergabung ke Jitsi Meeting Room!", "success");
      }
    } catch (err: any) {
      showMsg("Gagal join vicon", "error");
    }
  };

  const handleLeaveVicon = async () => {
    if (!vicon) return;
    try {
      const res = await fetch("/api/vicon/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentUserId,
          videoConferenceId: vicon.id,
          action: "leave",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsMeetingJoined(false);
        setAttendanceLog(data.result.updatedLog);
        if (data.result.countedAsPresent) {
          showMsg("Sesi kelas selesai! Presensi Anda tercatat Hadir Penuh (>= 75%).", "success");
        } else {
          showMsg("Sesi kelas selesai. Presensi tercatat Hadir Sebagian (< 75%).", "error");
        }
      }
    } catch (err: any) {
      showMsg("Gagal keluar vicon", "error");
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    showMsg("Tugas berhasil dikirim ke Dosen pengampu!", "success");
    setSubmissionStatus("terkirim");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header bar */}
      <header className="bg-slate-900 text-white shadow px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-sky-500/20">
            L
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white">LMS ICEMS</h1>
            <p className="text-xs text-slate-400 font-medium">Portal Mahasiswa UNSIA</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300">
          👤 Budi Santoso ({studentUserId})
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status notification toast */}
        {message && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 ${
              message.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            <span className="font-semibold text-sm">{message.text}</span>
          </div>
        )}

        {/* Column 1: Classes */}
        <div className="lg:col-span-1 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Kelas KRS Aktif</h2>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh]">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Belum ada mata kuliah KRS disetujui.
              </div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedClass?.id === cls.id
                      ? "bg-sky-50/50 border-sky-200 shadow-sm"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-display font-semibold text-sm text-slate-800 leading-tight mb-1">
                    {cls.courseName}
                  </div>
                  <div className="text-xs font-semibold text-sky-600 mb-2">{cls.courseCode} ({cls.sks} SKS)</div>
                  <div className="text-[11px] text-slate-500 font-medium">🗓️ {cls.scheduleText}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 2 & 3: Sessions and Material Access */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {selectedClass ? (
            <>
              {/* Class Info Header */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
                <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">KELAS MAHASISWA</span>
                <h2 className="font-display font-bold text-2xl mt-1 text-white">{selectedClass.courseName}</h2>
                <p className="text-sm text-slate-400 mt-1">Kode: {selectedClass.courseCode} | {selectedClass.sks} SKS | Periode: {selectedClass.academicPeriodLabel}</p>
              </div>

              {/* Sesi List & Details Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sesi list */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-display font-bold text-slate-800 border-b border-slate-100 pb-3">Daftar Pertemuan</h3>
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                    {sessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => handleSelectSession(sess)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          selectedSession?.id === sess.id
                            ? "bg-sky-50/50 border-sky-200 shadow-sm"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-display font-semibold text-sm text-slate-800">
                          Pertemuan ke-{sess.sessionNumber}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-1">{sess.topic}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sesi details and student actions */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  {selectedSession ? (
                    <>
                      {/* Topic info */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-xs font-bold text-sky-600 font-display">RUANG KULIAH</span>
                        <h3 className="font-display font-bold text-lg text-slate-800 mt-1">Pertemuan {selectedSession.sessionNumber}: {selectedSession.topic}</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedSession.description}</p>
                      </div>

                      {/* Video Conference Join Section */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Virtual Class Room (Vicon)</h4>
                        
                        {vicon ? (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <div>
                                <div className="font-bold text-sm text-slate-800">{vicon.title}</div>
                                <div className="text-xs text-slate-500 font-medium">Durasi: {vicon.durationMinutes} menit (Min. 75% hadir)</div>
                              </div>
                              
                              {!isMeetingJoined ? (
                                <button
                                  onClick={handleJoinVicon}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                                >
                                  🟢 Join Jitsi
                                </button>
                              ) : (
                                <button
                                  onClick={handleLeaveVicon}
                                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer animate-pulse"
                                >
                                  🔴 Leave Room
                                </button>
                              )}
                            </div>

                            {attendanceLog && (
                              <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100">
                                Status Kehadiran Jitsi: Terdaftar Join pada {new Date(attendanceLog.joinedAt).toLocaleTimeString()} 
                                {attendanceLog.leftAt && ` s.d. ${new Date(attendanceLog.leftAt).toLocaleTimeString()}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                            Tidak ada sesi Video Conference terjadwal untuk pertemuan ini.
                          </div>
                        )}
                      </div>

                      {/* Materials access (only verified "terbit" materials) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Materi Perkuliahan</h4>
                        <div className="flex flex-col gap-3 mt-4">
                          {materials.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                              Materi belum terbit untuk sesi ini (Menunggu Penjaminan Mutu).
                            </div>
                          ) : (
                            materials.map((mat) => (
                              <a
                                key={mat.id}
                                href={mat.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition duration-150 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-semibold text-sm text-slate-800">{mat.title}</div>
                                  <span className="text-[10px] font-bold text-sky-600 uppercase mt-0.5 inline-block">{mat.materialType}</span>
                                </div>
                                <span className="text-xs text-sky-600 font-bold">Buka Materi ↗</span>
                              </a>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Mock Assignment submission form */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Lembar Kerja Tugas</h4>
                        
                        <form onSubmit={handleSubmitAssignment} className="flex flex-col gap-4 mt-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Tulis Jawaban Tugas</label>
                            <textarea
                              rows={4}
                              value={assignmentAnswer}
                              onChange={(e) => setAssignmentAnswer(e.target.value)}
                              className="w-full mt-1 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                              placeholder="Ketik jawaban tugas Anda di sini..."
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">
                              Status: <span className="uppercase text-sky-600">{submissionStatus}</span>
                            </span>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition duration-200 cursor-pointer"
                            >
                              Submit Tugas
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white py-16 text-center text-slate-400 font-medium text-sm rounded-2xl border border-slate-100 shadow-sm">
                      Silakan pilih pertemuan di menu sebelah kiri untuk melihat detail sesi.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white py-24 text-center text-slate-400 font-medium text-sm rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">🎓</span>
              <span>Silakan pilih salah satu kelas di sebelah kiri untuk melihat sesi perkuliahan.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
