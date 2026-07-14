"use client";

import { useState, useEffect } from "react";
import { INSTITUTION_SHORT_NAME } from "@/lib/client-config";
type AdminTab = "dashboard" | "krs_validation" | "pddikti" | "audit";

interface KrsSubmission {
  id: string;
  name: string;
  nim: string;
  sksCount: number;
  courses: string[];
  status?: string;
}

export default function AcademicAdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [submissions, setSubmissions] = useState<KrsSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<KrsSubmission | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/admin/krs-submissions");
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
        if (data.submissions?.length > 0) {
          setSelectedSub(data.submissions[0]);
        }
      }
    } catch {}
  };

  const handleKrsApprove = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/krs-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId: id, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS ${name} berhasil disetujui (Approved)`);
        setSelectedSub(null);
        setRejectNote("");
        fetchSubmissions();
      } else {
        triggerToast(data.error || "Gagal menyetujui KRS");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
  };

  const handleKrsReject = async (id: string, name: string) => {
    if (!rejectNote) {
      triggerToast("Catatan penolakan wajib diisi");
      return;
    }
    try {
      const res = await fetch("/api/admin/krs-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krsId: id, action: "reject", note: rejectNote }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`KRS ${name} ditolak (Rejected) dengan catatan: ${rejectNote}`);
        setSelectedSub(null);
        setRejectNote("");
        fetchSubmissions();
      } else {
        triggerToast(data.error || "Gagal menolak KRS");
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    }
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
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#0a345c] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#FED524] flex items-center justify-center font-bold text-[#0f487b]">
              SIA
            </span>
            <span className="text-white font-bold tracking-tight text-sm">Admin Akademik</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
              AW
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-white truncate text-sm">Aris Wijaya</h3>
              <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase font-mono">Super Admin BAAK</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Operasional</p>

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
            <span>Beranda Analitik</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("krs_validation");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "krs_validation"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🛡️</span>
            <span>Validasi KRS Mahasiswa</span>
            {submissions.length > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("pddikti");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "pddikti"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>☁️</span>
            <span>Sinkronisasi PDDikti</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "audit"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📝</span>
            <span>Audit Logs</span>
          </button>
        </nav>
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
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Portal Admin Akademik</h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                Semester Ganjil {currentYear}/{currentYear + 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold">Aris Wijaya</span>
            <span className="h-8 w-px bg-slate-200"></span>
            <span className="text-slate-400 cursor-pointer">🔔</span>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Beranda Analitik Akademik</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <span>🎓</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Total Mahasiswa
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">12,450</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <span>🛡️</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Pengajuan KRS Menunggu
                  </p>
                  <p className="font-display font-black text-2xl text-slate-800">{submissions.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <span>☁️</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1">
                    Sync PDDikti Terakhir
                  </p>
                  <p className="font-display font-black text-lg text-emerald-600">Sukses (Hari Ini)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VALIDASI KRS */}
          {activeTab === "krs_validation" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
              {/* Submission List */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Daftar Antrean Pengajuan KRS
                </h3>
                {submissions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border text-slate-400 text-sm font-bold">
                    ✓ Tidak ada antrean pengajuan KRS saat ini.
                  </div>
                ) : (
                  submissions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSub(s)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedSub?.id === s.id
                          ? "border-[#0f487b] bg-blue-50/50"
                          : "border-slate-200 bg-white hover:border-[#0f487b]/30"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-base">{s.name}</div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{s.nim} · {s.prodi}</p>
                      </div>
                      <span className="text-xs bg-[#FED524]/20 text-[#0f487b] font-bold px-2 py-1 rounded">
                        {s.sksCount} SKS Diajukan
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Form Workspace */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                {selectedSub ? (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Persetujuan KRS
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSub.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSub.nim}</p>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500">Mata Kuliah Terpilih</p>
                      <ul className="space-y-1.5">
                        {selectedSub.courses.map((c, i) => (
                          <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <textarea
                        rows={2}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Catatan penolakan (wajib jika ditolak)..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-600"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleKrsReject(selectedSub.id, selectedSub.name)}
                          disabled={!rejectNote}
                          className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all ${
                            rejectNote
                              ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 cursor-pointer"
                              : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                          }`}
                        >
                          Tolak KRS
                        </button>
                        <button
                          onClick={() => handleKrsApprove(selectedSub.id, selectedSub.name)}
                          className="py-2.5 rounded-xl font-bold text-xs bg-[#0f487b] text-white border border-[#0f487b] hover:bg-[#00719f] cursor-pointer"
                        >
                          Setujui KRS
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    💡 Pilih pendaftar pada daftar antrean untuk meninjau krs mahasiswa.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PDDIKTI SYNC */}
          {activeTab === "pddikti" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Sinkronisasi Pangkalan Data Pendidikan Tinggi</h2>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                <span className="text-4xl">☁️</span>
                <h3 className="font-bold text-slate-800">{INSTITUTION_SHORT_NAME} Feeder Sync Agent</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Sinkronisasikan data mahasiswa, nilai KRS, dan kelulusan aktif langsung ke server PDDikti pusat secara terjadwal.
                </p>
                <button
                  onClick={() => triggerToast("Sinkronisasi PDDikti berhasil dimulai di latar belakang!")}
                  className="px-6 py-2.5 bg-[#0f487b] text-white font-bold text-xs rounded-xl hover:bg-[#00719f]"
                >
                  Mulai Sinkronisasi Sekarang
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Audit Logs Sistem Akademik</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Aktor</th>
                      <th className="px-6 py-4">Aksi</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">
                        Audit log akan terisi secara otomatis dari aktivitas admin (approve/reject KRS, dsb).
                      </td>
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
        <div className="fixed top-5 right-5 z-[210] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
