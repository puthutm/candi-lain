"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "./context/RoleContext";

interface LMSClass {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  academicPeriodLabel: string;
  scheduleText: string;
  classType: string;
  lastSyncedAt: string | null;
}

export default function HomeDashboard() {
  const { currentRole, user, toggleRole, logout, loading } = useRole();
  const [classes, setClasses] = useState<LMSClass[]>([]);
  const [fetching, setFetching] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const fetchClasses = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSync = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerToast("Sinkronisasi data SIAKAD berhasil diperbarui!");
        setSyncStatus(`Sinkronisasi terakhir: baru saja`);
        fetchClasses();
      } else {
        triggerToast(data.error || "Gagal sinkronisasi data");
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-2xl transition duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">✓</div>
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-md shadow-[#004996]/20">
              <span className="text-white font-display font-black text-lg">U</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FED524] border-2 border-white"></div>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-black text-slate-900 text-sm">UNSIA LMS</p>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                currentRole === "dosen"
                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              }`}>
                {currentRole === "dosen" ? "Dosen" : "Mahasiswa"}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Universitas Siber Asia</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition duration-150 text-xs font-bold cursor-pointer"
          >
            🔄 Tampilan {currentRole === "dosen" ? "Mahasiswa" : "Dosen"}
          </button>
          
          <button
            onClick={handleSync}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow-md transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {fetching ? "Menyinkronkan..." : "🔄 Sync Akademik"}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition duration-150 text-xs font-bold cursor-pointer"
          >
            🚪 Keluar SSO
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-[#004996] to-[#0a345c] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
          <div>
            <span className="text-xs font-black tracking-widest text-[#FED524] uppercase">SELAMAT DATANG</span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl mt-1 text-white">Halo, {user.name}!</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {currentRole === "dosen"
                ? "Kelola materi kuliah, tugas, kuis, live conference Jitsi, serta pantau dan publikasikan rekap nilai mahasiswa Anda."
                : "Akses materi kuliah dari kartu KRS Anda, kerjakan tugas, ikuti kuis, dan bergabung ke ruang live conference."}
            </p>
          </div>
          {syncStatus && (
            <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-md self-start md:self-auto">
              {syncStatus}
            </div>
          )}
        </div>

        {/* STATISTICS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {currentRole === "dosen" ? (
            <>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">🏫</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Kelas</h4>
                <p className="text-lg font-black text-slate-800">{classes.length} Kelas Mengajar</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📚</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Materi Rilis</h4>
                <p className="text-lg font-black text-slate-800">12 Modul Pembelajaran</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📝</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas Terkoreksi</h4>
                <p className="text-lg font-black text-[#004996]">92% Selesai Dinilai</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📈</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rerata Nilai</h4>
                <p className="text-lg font-black text-emerald-600">81.5 (B+)</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">🎓</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas Diikuti</h4>
                <p className="text-lg font-black text-slate-800">{classes.length} Kelas Terdaftar</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📖</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modul Dibaca</h4>
                <p className="text-lg font-black text-slate-800">80% Modul Selesai</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📂</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas Dikirim</h4>
                <p className="text-lg font-black text-[#004996]">4/5 Terkumpul</p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                <span className="text-2xl">📶</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kehadiran Vicon</h4>
                <p className="text-lg font-black text-emerald-600">95% Kehadiran</p>
              </div>
            </>
          )}
        </div>

        {/* Classes grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-800">
              {currentRole === "dosen" ? "Mata Kuliah Yang Anda Ampu" : "Mata Kuliah KRS Anda"}
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {classes.length} Kelas Terdaftar
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white py-16 text-center text-slate-400 font-medium text-sm rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">📬</span>
              <p>Belum ada data kelas akademis yang tersinkronasi.</p>
              <button
                onClick={handleSync}
                className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Klik untuk Sinkronisasi Data SIAKAD
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/courses/${cls.id}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#004996] hover:shadow-xl transition duration-300 flex flex-col group"
                >
                  {/* Banner color */}
                  <div className="h-24 bg-gradient-to-r from-[#004996] to-[#0a345c] p-5 flex flex-col justify-end relative">
                    <div className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase text-white tracking-wider backdrop-blur-sm">
                      {cls.classType === "akademik" ? "Akademik" : "Personal"}
                    </div>
                    <span className="text-[10px] font-black text-[#FED524] uppercase tracking-wider">{cls.courseCode}</span>
                    <h4 className="font-display font-bold text-lg text-white truncate leading-tight mt-0.5 group-hover:text-[#FED524] transition duration-200">
                      {cls.courseName}
                    </h4>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Ruang kelas digital interaktif untuk pembahasan modul perkuliahan, tugas terstruktur, ujian, dan live conference.
                    </p>
                    
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">⏱️ {cls.scheduleText}</span>
                      <span className="text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">{cls.sks} SKS</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
