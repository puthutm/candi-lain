"use client";

import { useRole } from "../context/RoleContext";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, currentRole, toggleRole, logout } = useRole();
  const [stats, setStats] = useState({
    materials: 0,
    questions: 0,
    pending: 0,
    usage: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const matRes = await fetch("/api/materi?status=all");
        const matData = await matRes.json();
        const qRes = await fetch("/api/soal?status=all");
        const qData = await qRes.json();

        if (matData.success && qData.success) {
          const totalMat = matData.materials.length;
          const totalQ = qData.questions.length;
          const pendingMat = matData.materials.filter((m: any) => m.verificationStatus !== "terbit" && m.verificationStatus !== "arsip").length;
          const pendingQ = qData.questions.filter((q: any) => q.verificationStatus !== "terbit" && q.verificationStatus !== "arsip").length;

          // Simple usage counter
          const matUsage = matData.materials.reduce((acc: number, m: any) => acc + (m.versions?.length || 0), 0);
          const qUsage = qData.questions.reduce((acc: number, q: any) => acc + (q.usageCount || 0), 0);

          setStats({
            materials: totalMat,
            questions: totalQ,
            pending: pendingMat + pendingQ,
            usage: matUsage + qUsage,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Bank Konten Akademik</h1>
            <p className="text-xs text-slate-400 font-medium">Universitas Siber Asia — Portal Repositori Terpusat</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulated role switcher */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => toggleRole(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white px-2 py-1 rounded-lg outline-none border-none cursor-pointer"
            >
              <option value="dosen">Dosen Kontributor</option>
              <option value="verifikator_prodi">Verifikator Prodi</option>
              <option value="verifikator_bpm">Verifikator BPM</option>
              <option value="admin_bank_konten">Admin Bank Konten</option>
            </select>
          </div>

          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-200">{user?.name || "Guest User"}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{currentRole}</p>
          </div>

          <button 
            onClick={logout} 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150 cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
            <span className="text-xs text-slate-400 block font-medium">Total Bahan Ajar</span>
            <span className="text-3xl font-black text-indigo-400 block mt-1">{stats.materials}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
            <span className="text-xs text-slate-400 block font-medium">Total Butir Soal</span>
            <span className="text-3xl font-black text-indigo-400 block mt-1">{stats.questions}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
            <span className="text-xs text-slate-400 block font-medium">Menunggu Verifikasi</span>
            <span className="text-3xl font-black text-amber-500 block mt-1">{stats.pending}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm">
            <span className="text-xs text-slate-400 block font-medium">Total Adopsi Kelas</span>
            <span className="text-3xl font-black text-emerald-500 block mt-1">{stats.usage}</span>
          </div>
        </section>

        {/* Action Modules */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Materials Card */}
          <Link href="/materi" className="group rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 shadow-md transition duration-300 flex flex-col justify-between h-64">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition">
                📂
              </div>
              <h2 className="text-xl font-bold mt-5 text-white">Bank Materi Akademik</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tempat mengunggah, revisi versi, pencarian, dan pemakaian bahan ajar (video, dokumen, slides) terintegrasi dengan LMS.
              </p>
            </div>
            <span className="text-xs text-indigo-400 font-bold tracking-wide mt-4 block">Buka Bank Materi &rarr;</span>
          </Link>

          {/* Questions Card */}
          <Link href="/soal" className="group rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 shadow-md transition duration-300 flex flex-col justify-between h-64">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition">
                📝
              </div>
              <h2 className="text-xl font-bold mt-5 text-white">Bank Soal Terpusat</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tulis butir soal pilihan ganda atau esai lengkap dengan taksonomi Bloom, tingkat kesulitan, kunci jawaban, dan statistik analisis butir soal.
              </p>
            </div>
            <span className="text-xs text-indigo-400 font-bold tracking-wide mt-4 block">Buka Bank Soal &rarr;</span>
          </Link>
        </section>

        {/* Verifier Queue Quick Access */}
        {(currentRole === "verifikator_prodi" || currentRole === "verifikator_bpm" || currentRole === "admin_bank_konten") && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-200">Antrean Verifikasi Konten</h2>
                <p className="text-xs text-slate-400 mt-0.5">Satu sistem verifikasi berjenjang terpusat untuk materi & soal.</p>
              </div>
              <Link href="/verifikasi" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition cursor-pointer text-white">
                Buka Portal Verifikasi
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
