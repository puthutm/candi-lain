"use client";

import React, { useState, useEffect } from "react";

interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
  dosenUserId: string;
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

export default function DosenDashboard() {
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

  // Mock Teacher ID matching seeded lecturers/admins
  const dosenUserId = "0421098501"; // NIDN hendra

  useEffect(() => {
    fetchClasses();
  }, []);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // For verification dashboard, let's load all synced classes
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Let's retrieve classes directly using a sync list
        // Let's write a small route to query classes, or pull it directly.
        // For simplicity, let's create a sync list API or just fetch them.
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      // Let's load the classes from local API
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        const data = await res.json();
        // Fallback mockup classes if db is completely empty
        if (data.success) {
          // Let's fetch classes
          const response = await fetch("/api/classes");
          const classesData = await response.json();
          if (classesData.success) {
            setClasses(classesData.classes);
          }
        }
      } catch (err: any) {
        showMsg("Gagal sinkronisasi data SIAKAD", "error");
      }
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showMsg(`Sync sukses! Terimpor ${data.result.classesCount} kelas dan ${data.result.enrollmentCount} KRS siswa.`, "success");
        // Refetch classes
        const response = await fetch("/api/classes");
        const classesData = await response.json();
        if (classesData.success) {
          setClasses(classesData.classes);
        }
      } else {
        showMsg(data.error, "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls: LMSClass) => {
    setSelectedClass(cls);
    setSelectedSession(null);
    setMaterials([]);
    // Load sessions
    try {
      const res = await fetch(`/api/sessions?classId=${cls.id}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (err: any) {
      showMsg("Gagal memuat sesi kuliah", "error");
    }
  };

  const handleSelectSession = async (sess: LMSSession) => {
    setSelectedSession(sess);
    fetchMaterials(sess.id);
  };

  const fetchMaterials = async (sessId: string) => {
    try {
      const res = await fetch(`/api/materials?sessionId=${sessId}&role=dosen`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      showMsg("Gagal memuat materi", "error");
    }
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
          materialType,
          title: materialTitle,
          fileUrl: materialUrl || "http://example.com/file.pdf",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Materi berhasil diajukan untuk verifikasi!", "success");
        setMaterialTitle("");
        setMaterialUrl("");
        fetchMaterials(selectedSession.id);
      } else {
        showMsg(data.error, "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    }
  };

  const handleVerify = async (materialId: string) => {
    try {
      const res = await fetch("/api/materials/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          tahap: verifierRole,
          keputusan: verifyStatus,
          catatan: verifyNote,
          verifierId: dosenUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(data.message, "success");
        setVerifyNote("");
        if (selectedSession) {
          fetchMaterials(selectedSession.id);
        }
      } else {
        showMsg(data.error, "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
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
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Video conference Jitsi berhasil dijadwalkan!", "success");
        setViconStatus(`Jitsi Room Created: ${data.vicon.meetingLink}`);
      }
    } catch (err: any) {
      showMsg("Gagal membuat Jitsi Conference", "error");
    }
  };

  const handlePublishGrades = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await fetch("/api/grades/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass.id,
          dosenUserId: selectedClass.dosenUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(data.message, "success");
      } else {
        showMsg(data.error, "error");
      }
    } catch (err: any) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header bar */}
      <header className="bg-slate-900 text-white shadow px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-violet-500/20">
            L
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white">LMS ICEMS</h1>
            <p className="text-xs text-slate-400 font-medium">Portal Dosen UNSIA</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl transition duration-200 shadow-md shadow-violet-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Sinkronisasi..." : "🔄 Sinkron SIAKAD"}
          </button>
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

        {/* Column 1: Sync list of Classes */}
        <div className="lg:col-span-1 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Kelas Akademik Anda</h2>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh]">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Belum ada data kelas ter-sync. Silakan klik tombol "Sync SIAKAD" di atas.
              </div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedClass?.id === cls.id
                      ? "bg-violet-50 border-violet-200 shadow-sm"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-display font-semibold text-sm text-slate-800 leading-tight mb-1">
                    {cls.courseName}
                  </div>
                  <div className="text-xs font-semibold text-violet-600 mb-2">{cls.courseCode} ({cls.sks} SKS)</div>
                  <div className="text-[11px] text-slate-500 font-medium">🗓️ {cls.scheduleText}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Column 2 & 3: Sessions and Details */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {selectedClass ? (
            <>
              {/* Class Info Header */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">KELAS DIAKTIFKAN</span>
                  <h2 className="font-display font-bold text-2xl mt-1 text-white">{selectedClass.courseName}</h2>
                  <p className="text-sm text-slate-400 mt-1">Kode: {selectedClass.courseCode} | {selectedClass.sks} SKS | Periode: {selectedClass.academicPeriodLabel}</p>
                </div>
                <button
                  onClick={handlePublishGrades}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm rounded-xl transition duration-200 shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  🔒 Kunci & Publikasi Nilai Akhir
                </button>
              </div>

              {/* Sesi List & Details Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sesi list */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-display font-bold text-slate-800 border-b border-slate-100 pb-3">Pertemuan (Sesi)</h3>
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
                    {sessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => handleSelectSession(sess)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          selectedSession?.id === sess.id
                            ? "bg-violet-50 border-violet-200 shadow-sm"
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

                {/* Sesi details and Actions */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  {selectedSession ? (
                    <>
                      {/* Topic title */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-xs font-bold text-violet-600">SESI AKADEMIK AKTIF</span>
                        <h3 className="font-display font-bold text-lg text-slate-800 mt-1">Pertemuan {selectedSession.sessionNumber}: {selectedSession.topic}</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedSession.description}</p>
                      </div>

                      {/* Video Conference simulation */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Live Conference (Jitsi)</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-500">Durasi Kelas (menit)</label>
                            <input
                              type="number"
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(Number(e.target.value))}
                              className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                            />
                          </div>
                          <button
                            onClick={handleCreateVicon}
                            className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl cursor-pointer"
                          >
                            📹 Buat Link Jitsi
                          </button>
                        </div>
                        {viconStatus && (
                          <div className="mt-2 text-xs font-semibold bg-violet-50 text-violet-700 p-3 rounded-lg border border-violet-100 break-all">
                            {viconStatus}
                          </div>
                        )}
                      </div>

                      {/* Add Material form */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Unggah Bahan Ajar</h4>
                        
                        <form onSubmit={handleAddMaterial} className="flex flex-col gap-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Judul Bahan Ajar</label>
                              <input
                                type="text"
                                required
                                value={materialTitle}
                                onChange={(e) => setMaterialTitle(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                                placeholder="e.g. Modul 1 - Pendahuluan"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Tipe Berkas</label>
                              <select
                                value={materialType}
                                onChange={(e) => setMaterialType(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium bg-white"
                              >
                                <option value="dokumen">Dokumen (PDF/DOCX)</option>
                                <option value="video">Video (MP4/Youtube)</option>
                                <option value="tautan">Tautan Luar</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-500">URL File</label>
                            <input
                              type="text"
                              required
                              value={materialUrl}
                              onChange={(e) => setMaterialUrl(e.target.value)}
                              className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                              placeholder="e.g. http://storage.unsia.ac.id/modul.pdf"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl self-end transition duration-200 shadow-lg cursor-pointer"
                          >
                            🚀 Ajukan Bahan Ajar
                          </button>
                        </form>
                      </div>

                      {/* Materials List & Verification Panel */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Bahan Ajar & Status Verifikasi</h4>

                        <div className="flex flex-col gap-4 mt-4">
                          {materials.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                              Belum ada bahan ajar diunggah untuk sesi ini.
                            </div>
                          ) : (
                            materials.map((mat) => (
                              <div key={mat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-display font-bold text-sm text-slate-800">{mat.title}</div>
                                    <span className="text-[11px] font-semibold text-slate-500 uppercase mt-0.5 inline-block">{mat.materialType}</span>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                    mat.verificationStatus === "terbit"
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : mat.verificationStatus === "revisi"
                                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                                      : "bg-amber-50 text-amber-600 border border-amber-100"
                                  }`}>
                                    {mat.verificationStatus === "menunggu_prodi" ? "Menunggu Prodi" : mat.verificationStatus === "menunggu_bpm" ? "Menunggu BPM" : mat.verificationStatus}
                                  </span>
                                </div>

                                {mat.revisionNote && (
                                  <div className="text-xs bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-100 font-semibold">
                                    Catatan Revisi: {mat.revisionNote}
                                  </div>
                                )}

                                {/* Simulates verification check */}
                                {mat.verificationStatus !== "terbit" && mat.verificationStatus !== "revisi" && (
                                  <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-3">
                                    <span className="text-xs font-bold text-slate-700">Simulasikan Aksi Verifikasi (Prodi / BPM):</span>
                                    <div className="flex items-center gap-3">
                                      <select
                                        value={verifierRole}
                                        onChange={(e) => setVerifierRole(e.target.value as "prodi" | "bpm")}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                                      >
                                        <option value="prodi">Verifikator Prodi</option>
                                        <option value="bpm">Verifikator BPM</option>
                                      </select>
                                      <select
                                        value={verifyStatus}
                                        onChange={(e) => setVerifyStatus(e.target.value as "setuju" | "revisi")}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                                      >
                                        <option value="setuju">Setujui (Approve)</option>
                                        <option value="revisi">Minta Revisi (Reject)</option>
                                      </select>
                                      <input
                                        type="text"
                                        placeholder="Catatan jika meminta revisi"
                                        value={verifyNote}
                                        onChange={(e) => setVerifyNote(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleVerify(mat.id)}
                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                                      >
                                        Submit Aksi
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white py-16 text-center text-slate-400 font-medium text-sm rounded-2xl border border-slate-100 shadow-sm shadow-slate-100">
                      Silakan pilih pertemuan di menu sebelah kiri untuk melihat detail sesi.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white py-24 text-center text-slate-400 font-medium text-sm rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">📚</span>
              <span>Silakan pilih salah satu kelas di sebelah kiri untuk melihat isi linimasa sesi perkuliahan.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
