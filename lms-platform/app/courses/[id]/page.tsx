"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRole } from "../../context/RoleContext";

interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
  dosenUserId: string;
  classType: string;
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
  verificationStatus: string;
  revisionNote: string | null;
}

function getStudentProfile(userId: string) {
  if (userId === "26090182") return { name: "Budi Santoso", initial: "BS", color: "blue" };
  if (userId === "25090127" || userId.endsWith("7") || userId.endsWith("1")) return { name: "Citra Lestari", initial: "CL", color: "emerald" };
  if (userId === "25090129" || userId.endsWith("9") || userId.endsWith("2")) return { name: "Dewi Maharani", initial: "DM", color: "violet" };
  return { name: `Mahasiswa (${userId.slice(-4)})`, initial: "M", color: "slate" };
}

export default function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const classId = unwrappedParams.id;
  const { currentRole, user, toggleRole, logout, loading: sessionLoading } = useRole();

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Menghubungkan ke SSO...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const [cls, setCls] = useState<LMSClass | null>(null);
  const [sessions, setSessions] = useState<LMSSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LMSSession | null>(null);
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);

  // DB dynamic states
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  // Forum states
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Duplikasi states
  const [allClasses, setAllClasses] = useState<LMSClass[]>([]);
  const [selectedSourceClassId, setSelectedSourceClassId] = useState("");
  const [showDuplikasiModal, setShowDuplikasiModal] = useState(false);

  // Interactive Video states
  const [videoData, setVideoData] = useState<any>(null);
  const [videoMarkers, setVideoMarkers] = useState<any[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [markerAnswer, setMarkerAnswer] = useState("");

  // Vicon states
  const [vicon, setVicon] = useState<any>(null);
  const [viconLoading, setViconLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(90);

  // Tabs
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "vicon" | "nilai" | "peserta" | "forum" | "kelompok">("materi");

  // Form states (Materials)
  const [matTitle, setMatTitle] = useState("");
  const [matType, setMatType] = useState("dokumen");
  const [matUrl, setMatUrl] = useState("");
  
  // Verification states
  const [verifierRole, setVerifierRole] = useState<"prodi" | "bpm">("prodi");
  const [verifyStatus, setVerifyStatus] = useState<"setuju" | "revisi">("setuju");
  const [verifyNote, setVerifyNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchClassDetails();
    fetchClassesForDuplication();
  }, [classId]);

  const triggerMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchClassDetails = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        const found = data.classes.find((c: LMSClass) => c.id === classId);
        if (found) {
          setCls(found);
          fetchSessions(found.id);
          fetchGradesRekap(found.id);
          fetchForumPosts(found.id);
        }
      }
    } catch (err) {
      triggerMsg("Gagal memuat detail kelas", "error");
    }
  };

  const fetchClassesForDuplication = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setAllClasses(data.classes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGradesRekap = async (cId: string) => {
    try {
      const res = await fetch(`/api/grades/rekap?classId=${cId}`);
      const data = await res.json();
      if (data.success) {
        setGrades(data.grades);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForumPosts = async (cId: string) => {
    try {
      const res = await fetch(`/api/forum?classId=${cId}`);
      const data = await res.json();
      if (data.success) {
        setForumPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async (cId: string) => {
    try {
      const res = await fetch(`/api/sessions?classId=${cId}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        if (data.sessions.length > 0) {
          setSelectedSession(data.sessions[0]!);
          fetchSessionContents(data.sessions[0]!.id);
        }
      }
    } catch (err) {
      triggerMsg("Gagal memuat sesi pertemuan", "error");
    }
  };

  const fetchSessionContents = async (sessId: string) => {
    // 1. Fetch Materials
    try {
      const res = await fetch(`/api/materials?sessionId=${sessId}&role=${currentRole}`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      console.error(err);
    }

    // 2. Fetch Vicon
    try {
      const res = await fetch(`/api/vicon/active?sessionId=${sessId}`);
      const data = await res.json();
      if (data.success) {
        setVicon(data.vicon);
      }
    } catch (err) {
      console.error(err);
    }

    // 3. Fetch Assignment Submissions
    try {
      const res = await fetch(`/api/assignments/submissions?sessionId=${sessId}`);
      const data = await res.json();
      if (data.success) {
        setAssignment(data.assignment);
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error(err);
    }

    // 4. Fetch Interactive Video & Markers
    try {
      const res = await fetch(`/api/interactive-video?sessionId=${sessId}`);
      const data = await res.json();
      if (data.success) {
        setVideoData(data.video);
        setVideoMarkers(data.markers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSession = (sess: LMSSession) => {
    setSelectedSession(sess);
    setIsJoined(false);
    fetchSessionContents(sess.id);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          materialType: matType,
          title: matTitle,
          fileUrl: matUrl || "http://storage.unsia.ac.id/materi.pdf",
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Bahan ajar diajukan ke Kaprodi!", "success");
        setMatTitle("");
        setMatUrl("");
        fetchSessionContents(selectedSession.id);
      } else {
        triggerMsg(data.error, "error");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  const handleVerifyMaterial = async (matId: string) => {
    try {
      const res = await fetch("/api/materials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: matId,
          tahap: verifierRole,
          keputusan: verifyStatus,
          catatan: verifyNote,
          verifierId: user.userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg(data.message, "success");
        setVerifyNote("");
        if (selectedSession) fetchSessionContents(selectedSession.id);
      } else {
        triggerMsg(data.error, "error");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  const handleCreateVicon = async () => {
    if (!selectedSession) return;
    setViconLoading(true);
    try {
      const res = await fetch("/api/vicon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Jitsi Room berhasil dijadwalkan!", "success");
        setVicon(data.vicon);
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    } finally {
      setViconLoading(false);
    }
  };

  const handleJoinVicon = async () => {
    if (!vicon) return;
    try {
      const res = await fetch("/api/vicon/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          videoConferenceId: vicon.id,
          action: "join",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsJoined(true);
        triggerMsg("Berhasil bergabung ke Jitsi Meeting Room!", "success");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  const handleLeaveVicon = async () => {
    if (!vicon) return;
    try {
      const res = await fetch("/api/vicon/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          videoConferenceId: vicon.id,
          action: "leave",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsJoined(false);
        if (data.result.countedAsPresent) {
          triggerMsg("Keluar vicon. Kehadiran dihitung HADIR PENUH (>= 75%).", "success");
        } else {
          triggerMsg("Keluar vicon. Kehadiran dihitung HADIR SEBAGIAN (< 75%).", "error");
        }
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  const handlePublishGrades = async () => {
    if (!cls) return;
    setLoading(true);
    try {
      const res = await fetch("/api/grades/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          dosenUserId: cls.dosenUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Rekap nilai akhir berhasil dikirim ke database SIAKAD!", "success");
        fetchGradesRekap(cls.id);
      } else {
        triggerMsg(data.error, "error");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    
    const form = e.currentTarget as HTMLFormElement;
    const answerInput = form.elements.namedItem("answerText") as HTMLTextAreaElement;

    try {
      const res = await fetch("/api/assignments/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentUserId: user.userId,
          answerText: answerInput.value,
          status: "terkirim",
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Tugas berhasil dikirim ke Dosen pengampu!", "success");
        if (selectedSession) fetchSessionContents(selectedSession.id);
        form.reset();
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  // Forum submit post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cls) return;
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_post",
          classId: cls.id,
          authorName: user.name,
          authorRole: currentRole,
          authorUserId: user.userId,
          title: newPostTitle || "Diskusi Topik Sesi",
          body: newPostBody,
          type: currentRole === "dosen" ? "pengumuman" : "question",
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Postingan forum berhasil diposting!", "success");
        setNewPostTitle("");
        setNewPostBody("");
        fetchForumPosts(cls.id);
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  // Forum reply post
  const handleReplyPost = async (postId: string) => {
    const textBody = replyInputs[postId];
    if (!textBody) return;
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          postId,
          authorName: user.name,
          authorRole: currentRole,
          authorUserId: user.userId,
          body: textBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Komentar terkirim ke Lini Masa!", "success");
        setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
        if (cls) fetchForumPosts(cls.id);
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  // Duplikasi execute
  const handleExecuteDuplikasi = async () => {
    if (!cls || !selectedSourceClassId) return;
    try {
      const res = await fetch("/api/materials/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceClassId: selectedSourceClassId,
          targetClassId: cls.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg(data.message, "success");
        setShowDuplikasiModal(false);
        fetchSessions(cls.id);
      } else {
        triggerMsg(data.error, "error");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  // Video Marker answers
  const handleAnswerMarker = async () => {
    if (!activeMarker) return;
    try {
      const res = await fetch("/api/interactive-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer_marker",
          markerId: activeMarker.id,
          studentUserId: user.userId,
          answerText: markerAnswer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerMsg("Jawaban kuis video terekam!", "success");
        setActiveMarker(null);
        setMarkerAnswer("");
      }
    } catch (err: any) {
      triggerMsg(err.message, "error");
    }
  };

  // Simulate playback slider movement
  const handlePlaybackSlider = (val: number) => {
    setPlaybackTime(val);
    const marker = videoMarkers.find((m) => m.timestampSeconds === val);
    if (marker) {
      setActiveMarker(marker);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Toast */}
      {message && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl transition-all duration-300 ${
          message.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        }`}>
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      {/* Duplikasi Modal */}
      {showDuplikasiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <h3 className="font-display font-extrabold text-base text-slate-800">Duplikasi Bahan Ajar</h3>
            <p className="text-xs text-slate-500">Salin seluruh materi kuliah dan plotting pertemuan dari kelas periode akademik lalu.</p>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Kelas Sumber</label>
              <select
                value={selectedSourceClassId}
                onChange={(e) => setSelectedSourceClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold bg-white"
              >
                <option value="">-- Pilih Mata Kuliah --</option>
                {allClasses
                  .filter((c) => c.id !== classId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseName} ({c.courseCode})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDuplikasiModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDuplikasi}
                className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Duplikasikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Marker Quiz Modal */}
      {activeMarker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase font-display">Kuis Marker Video ({activeMarker.timestampSeconds}s)</span>
            <h4 className="font-display font-bold text-sm text-slate-800">{activeMarker.questionText}</h4>
            
            {activeMarker.questionType === "pilihan_ganda" ? (
              <div className="flex flex-col gap-2 mt-2">
                {activeMarker.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setMarkerAnswer(opt)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition ${
                      markerAnswer === opt ? "bg-slate-50 border-[#004996]" : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                value={markerAnswer}
                onChange={(e) => setMarkerAnswer(e.target.value)}
                className="w-full mt-2 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                placeholder="Ketik jawaban esai Anda..."
              />
            )}

            <button
              onClick={handleAnswerMarker}
              className="w-full mt-4 py-3 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Kirim Jawaban
            </button>
          </div>
        </div>
      )}

      {/* HEADER bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-md">
              <span className="text-white font-display font-black text-lg">U</span>
            </div>
            <div className="leading-tight">
              <p className="font-display font-black text-slate-900 text-sm">UNSIA LMS</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Universitas Siber Asia</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500 font-bold">
            <Link href="/" className="hover:text-[#004996]">Beranda</Link>
            <span>/</span>
            <span className="text-slate-900">{cls?.courseName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition duration-150 text-xs font-bold cursor-pointer"
          >
            🔄 Tampilan {currentRole === "dosen" ? "Mahasiswa" : "Dosen"}
          </button>
          
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition duration-150 text-xs font-bold"
          >
            🏠 Beranda
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition duration-150 text-xs font-bold cursor-pointer"
          >
            🚪 Keluar SSO
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        
        {/* Class Banner */}
        {cls && (
          <div className="bg-gradient-to-r from-[#004996] to-[#0a345c] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <span className="text-xs font-black tracking-widest text-[#FED524] uppercase">MATA KULIAH</span>
              <h2 className="font-display font-extrabold text-2xl md:text-3xl mt-1 text-white">{cls.courseName}</h2>
              <p className="text-sm text-slate-300 mt-1">Kode: {cls.courseCode} | {cls.sks} SKS | Periode: {cls.academicPeriodLabel} | Kelas: {cls.classType}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {currentRole === "dosen" && (
                <>
                  <button
                    onClick={() => setShowDuplikasiModal(true)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    📂 Duplikasi Bahan Ajar
                  </button>
                  <button
                    onClick={handlePublishGrades}
                    disabled={loading}
                    className="px-5 py-3 bg-[#FED524] hover:bg-[#FED524]/95 text-slate-900 font-bold text-xs rounded-xl shadow-lg shadow-[#FED524]/10 transition duration-200 cursor-pointer animate-pulse"
                  >
                    🔒 Lock & Publish ke SIAKAD
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm">
          {(["materi", "tugas", "vicon", "forum", "kelompok", "nilai", "peserta"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? "bg-[#004996] text-white shadow-md shadow-[#004996]/15"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab === "vicon" ? "Live Conference" : tab}
            </button>
          ))}
        </div>

        {/* Sesi & Tab contents split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sesi List (1-16) */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm self-start">
            <h3 className="font-display font-bold text-slate-800 border-b border-slate-100 pb-3">Pertemuan Kuliah</h3>
            <div className="flex flex-col gap-2 mt-3 overflow-y-auto max-h-[55vh] pr-1">
              {sessions.map((sess: LMSSession) => (
                <button
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedSession?.id === sess.id
                      ? "bg-slate-50 border-[#004996] shadow-sm font-semibold"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-display font-bold text-xs text-slate-800">
                    Sesi {sess.sessionNumber}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold truncate mt-1">{sess.topic}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Tab content */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {selectedSession ? (
              <>
                {/* Active Sesi Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] font-black text-[#004996] uppercase tracking-widest font-display">PERTEMUAN AKTIF</span>
                  <h3 className="font-display font-extrabold text-xl text-slate-800 mt-1">Sesi {selectedSession.sessionNumber}: {selectedSession.topic}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{selectedSession.description}</p>
                </div>

                {/* TAB: MATERI */}
                {activeTab === "materi" && (
                  <div className="flex flex-col gap-6">
                    {currentRole === "dosen" && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Unggah Bahan Ajar</h4>
                        <form onSubmit={handleAddMaterial} className="flex flex-col gap-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Materi</label>
                              <input
                                type="text"
                                required
                                value={matTitle}
                                onChange={(e) => setMatTitle(e.target.value)}
                                className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                                placeholder="e.g. Slide Pertemuan 1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Tipe</label>
                              <select
                                value={matType}
                                onChange={(e) => setMatType(e.target.value)}
                                className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold bg-white"
                              >
                                <option value="dokumen">Dokumen PDF</option>
                                <option value="video">Video YouTube</option>
                                <option value="tautan">Tautan Eksternal</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">URL File</label>
                            <input
                              type="text"
                              required
                              value={matUrl}
                              onChange={(e) => setMatUrl(e.target.value)}
                              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                              placeholder="e.g. http://storage.unsia.ac.id/slides.pdf"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl self-end transition cursor-pointer"
                          >
                            🚀 Upload & Ajukan
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Interactive Video Player component from mockup */}
                    {videoData && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-rose-600 tracking-wider uppercase font-display">Interactive Lecture Video</span>
                        <h4 className="font-display font-bold text-sm text-slate-800">{videoData.title}</h4>
                        
                        <div className="aspect-video w-full bg-slate-950 rounded-xl relative flex items-center justify-center text-white overflow-hidden shadow-lg border border-slate-850">
                          <span className="text-4xl text-rose-600">▶️</span>
                          
                          {/* Markers indicator circles */}
                          {videoMarkers.map((m) => (
                            <div
                              key={m.id}
                              style={{ left: `${(m.timestampSeconds / 300) * 100}%` }}
                              className="absolute bottom-12 w-3.5 h-3.5 rounded-full bg-[#FED524] border-2 border-white shadow cursor-help transform -translate-x-1/2"
                              title={m.questionText}
                            />
                          ))}

                          <div className="absolute bottom-3 inset-x-4 flex items-center gap-3">
                            <span className="text-[10px] font-bold tracking-wider">{playbackTime}s / 300s</span>
                            <input
                              type="range"
                              min="0"
                              max="300"
                              value={playbackTime}
                              onChange={(e) => handlePlaybackSlider(Number(e.target.value))}
                              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FED524]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Bahan Ajar Tersedia</h4>
                      <div className="flex flex-col gap-3 mt-4">
                        {materials.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs font-medium">
                            Belum ada materi terbit untuk pertemuan ini.
                          </div>
                        ) : (
                          materials.map((mat: LMSMaterial) => (
                            <div key={mat.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-display font-bold text-sm text-slate-800">{mat.title}</div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{mat.materialType}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {currentRole === "mahasiswa" ? (
                                    <a
                                      href={mat.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3.5 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-lg transition"
                                    >
                                      Buka File ↗
                                    </a>
                                  ) : (
                                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                                      mat.verificationStatus === "terbit"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : mat.verificationStatus === "revisi"
                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                    }`}>
                                      {mat.verificationStatus}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {mat.revisionNote && (
                                <div className="text-xs bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-100 font-semibold">
                                  Catatan Revisi: {mat.revisionNote}
                                </div>
                              )}

                              {currentRole === "dosen" && mat.verificationStatus !== "terbit" && mat.verificationStatus !== "revisi" && (
                                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-3">
                                  <select
                                    value={verifierRole}
                                    onChange={(e) => setVerifierRole(e.target.value as "prodi" | "bpm")}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold bg-white"
                                  >
                                    <option value="prodi">Prodi Verifikator</option>
                                    <option value="bpm">BPM Verifikator</option>
                                  </select>
                                  <select
                                    value={verifyStatus}
                                    onChange={(e) => setVerifyStatus(e.target.value as "setuju" | "revisi")}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold bg-white"
                                  >
                                    <option value="setuju">Approve</option>
                                    <option value="revisi">Minta Revisi</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Catatan revisi (jika ditolak)"
                                    value={verifyNote}
                                    onChange={(e) => setVerifyNote(e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleVerifyMaterial(mat.id)}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                                  >
                                    Simulasi Verifikasi
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: TUGAS */}
                {activeTab === "tugas" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TUGAS SESI {selectedSession.sessionNumber}</span>
                      <h4 className="font-display font-bold text-base text-slate-800 mt-1">
                        {assignment ? assignment.title : "Modul Pembahasan Tugas Kuliah"}
                      </h4>
                      <p className="text-xs text-slate-600 mt-2 font-medium">
                        {assignment ? assignment.instructions : "Instruksi pengerjaan tugas belum diisi."}
                      </p>
                    </div>

                    {currentRole === "dosen" ? (
                      <div className="flex flex-col gap-4">
                        <h5 className="font-display font-bold text-sm text-slate-800">Daftar Pengumpulan Mahasiswa</h5>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                <th className="px-5 py-3.5">Mahasiswa</th>
                                <th className="px-5 py-3.5">NIM</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions.map((sub: any) => {
                                const profile = getStudentProfile(sub.studentUserId);
                                return (
                                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                          {profile.initial}
                                        </div>
                                        <span className="font-bold text-xs text-slate-800">{profile.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">{sub.studentUserId}</td>
                                    <td className="px-5 py-3.5">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                                        sub.status === "dinilai" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                      }`}>
                                        {sub.status === "dinilai" ? `Dinilai: ${sub.score}` : sub.status}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                      <Link
                                        href={`/courses/${classId}/assignments/${selectedSession.id}?studentNim=${sub.studentUserId}`}
                                        className="px-3.5 py-1.5 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-[10px] rounded-lg transition"
                                      >
                                        🖊️ Anotasi & Nilai
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <form onSubmit={handleStudentSubmitTask} className="flex flex-col gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600">Jawaban Tugas Anda</label>
                            <textarea
                              name="answerText"
                              rows={4}
                              required
                              className="w-full mt-1.5 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-medium"
                              placeholder="Tuliskan jawaban tugas Anda di sini..."
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">
                              Status Submission:{" "}
                              <span className="uppercase text-sky-600 font-bold">
                                {submissions.find((s) => s.studentUserId === user.userId)?.status || "belum_dikerjakan"}
                              </span>
                            </span>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl self-end cursor-pointer"
                            >
                              Submit Tugas
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: VICON */}
                {activeTab === "vicon" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                        <span className="text-teal-600 text-lg">📹</span>
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-800">Live Conference Jitsi</h4>
                        <p className="text-xs text-slate-500 font-medium">Simulasikan tatap muka kelas virtual dan rekam kehadiran otomatis.</p>
                      </div>
                    </div>

                    {vicon ? (
                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <div className="font-bold text-sm text-slate-800">{vicon.title}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">Durasi: {vicon.durationMinutes} menit (Min. 75% hadir)</div>
                            <span className="text-[10px] text-slate-400 font-mono select-all mt-1 inline-block break-all bg-white px-2 py-0.5 rounded border border-slate-100">{vicon.meetingLink}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isJoined ? (
                              <button
                                onClick={handleJoinVicon}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                              >
                                🟢 Join Conference
                              </button>
                            ) : (
                              <button
                                onClick={handleLeaveVicon}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer animate-pulse"
                              >
                                🔴 Leave Conference
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 items-center justify-center py-10 text-slate-400">
                        <span className="text-3xl">📭</span>
                        <p className="text-xs font-semibold">Belum ada conference dijadwalkan.</p>
                        
                        {currentRole === "dosen" && (
                          <div className="mt-4 flex items-center gap-3 max-w-sm w-full">
                            <input
                              type="number"
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(Number(e.target.value))}
                              className="w-24 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold"
                            />
                            <button
                              onClick={handleCreateVicon}
                              disabled={viconLoading}
                              className="flex-1 px-5 py-2.5 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                            >
                              {viconLoading ? "Membuat..." : "📹 Jadwalkan Room Jitsi"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: FORUM (Diskusi) */}
                {activeTab === "forum" && (
                  <div className="flex flex-col gap-6">
                    {/* New post form */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Buat Postingan Diskusi</h4>
                      
                      <form onSubmit={handleCreatePost} className="flex flex-col gap-4 mt-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Subjek / Topik</label>
                          <input
                            type="text"
                            required
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                            placeholder="e.g. Pertanyaan seputar Tugas MVC"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase font-display">Isi Pesan</label>
                          <textarea
                            rows={3}
                            required
                            value={newPostBody}
                            onChange={(e) => setNewPostBody(e.target.value)}
                            className="w-full mt-1.5 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                            placeholder="Tuliskan pertanyaan atau pengumuman Anda di forum..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl self-end cursor-pointer"
                        >
                          📣 Kirim ke Forum
                        </button>
                      </form>
                    </div>

                    {/* Timeline forum list */}
                    <div className="flex flex-col gap-4">
                      {forumPosts.length === 0 ? (
                        <div className="bg-white py-12 text-center text-slate-400 text-xs font-medium rounded-2xl border border-slate-200">
                          Belum ada diskusi di kelas ini. Mari mulai topik pertama!
                        </div>
                      ) : (
                        forumPosts.map((post) => (
                          <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center font-display font-black text-xs">
                                {post.authorName.slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">{post.authorName}</span>
                                  <span className="text-[8px] font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{post.authorRole}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">{new Date(post.createdAt).toLocaleString()}</span>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-display font-bold text-base text-slate-800">{post.title}</h5>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{post.body}</p>
                            </div>

                            {/* Replies list */}
                            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Komentar ({post.replies?.length || 0})</span>
                              
                              {post.replies?.map((rep: any) => (
                                <div key={rep.id} className="p-3 bg-slate-50 rounded-xl flex gap-3 items-start border border-slate-100">
                                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[9px]">
                                    {rep.authorName.slice(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-slate-800">{rep.authorName}</span>
                                      <span className="text-[8px] font-bold uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">{rep.authorRole}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rep.body}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Write comment input */}
                              <div className="flex gap-2 items-center mt-2">
                                <input
                                  type="text"
                                  placeholder="Ketik komentar Anda..."
                                  value={replyInputs[post.id] || ""}
                                  onChange={(e) => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleReplyPost(post.id);
                                  }}
                                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                                />
                                <button
                                  onClick={() => handleReplyPost(post.id)}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                                >
                                  Balas
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: KELOMPOK */}
                {activeTab === "kelompok" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Kelompok Diskusi Mahasiswa</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-display">Kelompok 1 (Front-End)</span>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>👤 Citra Lestari (25090127)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>👤 Budi Santoso (26090182)</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-display">Kelompok 2 (Back-End)</span>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>👤 Dewi Maharani (25090129)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span>👤 Eko Putra (25090130)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: NILAI */}
                {activeTab === "nilai" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="font-display font-bold text-sm text-slate-800">Rekap Nilai Akhir Semester</h4>
                      {currentRole === "dosen" && (
                        <button
                          onClick={handlePublishGrades}
                          className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                        >
                          🔒 Kirim Nilai ke SIAKAD
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                            <th className="px-5 py-3.5">Mahasiswa</th>
                            <th className="px-5 py-3.5">Kehadiran</th>
                            <th className="px-5 py-3.5">Tugas Avg</th>
                            <th className="px-5 py-3.5">UTS</th>
                            <th className="px-5 py-3.5">UAS</th>
                            <th className="px-5 py-3.5">Akhir</th>
                            <th className="px-5 py-3.5">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((n: any) => {
                            const profile = getStudentProfile(n.studentUserId);
                            return (
                              <tr key={n.id || n.studentUserId} className="border-b border-slate-100 hover:bg-slate-50 text-xs">
                                <td className="px-5 py-3.5 font-bold text-slate-800">{profile.name} ({n.studentUserId})</td>
                                <td className="px-5 py-3.5 font-semibold text-slate-500">{n.attendanceScore}%</td>
                                <td className="px-5 py-3.5 font-bold text-slate-800">{n.assignmentScore}</td>
                                <td className="px-5 py-3.5 font-bold text-slate-800">{n.utsScore}</td>
                                <td className="px-5 py-3.5 font-bold text-slate-800">{n.uasScore}</td>
                                <td className="px-5 py-3.5 font-extrabold text-emerald-600">{n.finalScore}</td>
                                <td className="px-5 py-3.5">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                                    {n.letterGrade || "E"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: PESERTA */}
                {activeTab === "peserta" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Peserta Kuliah</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {grades.map((p: any) => {
                        const profile = getStudentProfile(p.studentUserId);
                        return (
                          <div key={p.studentUserId} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-black text-xs">
                              {profile.initial}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{profile.name}</p>
                              <p className="text-[10px] text-slate-500 font-semibold">{p.studentUserId}</p>
                            </div>
                            <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase rounded-full">Aktif</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white py-24 text-center text-slate-400 font-medium text-sm rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
                <span className="text-4xl"> Pertemuan </span>
                <span>Pilih pertemuan kuliah di sebelah kiri untuk melihat modul.</span>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
