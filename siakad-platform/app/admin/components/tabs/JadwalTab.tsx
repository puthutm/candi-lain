"use client";

import { AdminTab } from "../AdminSidebar";

interface JadwalTabProps {
  setActiveTab: (tab: AdminTab) => void;
  triggerToast: (msg: string) => void;
}

export default function JadwalTab({
  setActiveTab,
  triggerToast,
}: JadwalTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Operasional
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Jadwal & Sesi Perkuliahan</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Tanggal mulai & durasi perkuliahan <strong>otomatis ditarik dari setting Periode Akademik aktif</strong>. Penyusunan jadwal mengikuti 5 tahap sequential.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Sequential Steps Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>📋</span> 5 Tahap Sequential Penyusunan Jadwal Perkuliahan
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
          <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 1. Inventarisasi MK</button>
          <span className="text-slate-400 font-mono">→</span>
          <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 2. Alokasi Dosen</button>
          <span className="text-slate-400 font-mono">→</span>
          <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 3. Alokasi Ruang</button>
          <span className="text-slate-400 font-mono">→</span>
          <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 4. Slot Waktu</button>
          <span className="text-slate-400 font-mono">→</span>
          <button className="px-3 py-2 rounded-xl bg-[#0f487b] text-white shrink-0 shadow-md">⏱ 5. Set Tanggal Mulai (Auto-fill)</button>
        </div>
      </div>

      {/* Auto-fill Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <span className="text-emerald-600 text-xl shrink-0">✓</span>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-emerald-900">Auto-fill dari Periode Akademik Aktif (Ganjil 2026/2027)</h4>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Tanggal sesi 1 hingga sesi 16 di bawah ini otomatis terisi dari setting <strong>Periode Akademik · TA 2026/2027 Ganjil</strong>. Perubahan tanggal pada periode akan otomatis re-sync ke seluruh kelas & LMS.
          </p>
          <button
            onClick={() => setActiveTab("periode")}
            className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            ✏️ Edit Periode Akademik
          </button>
        </div>
      </div>

      {/* Table Sesi 1 - 16 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Matriks Matakuliah & Jadwal Sesi Pertemuan (1-16)</h3>
          <button
            onClick={() => triggerToast("Jadwal sesi disinkronkan ke LMS")}
            className="px-3 py-1 bg-[#0f487b] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            🔄 Re-sync LMS
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Sesi</th>
                <th className="px-5 py-3">Topik & Aktivitas Pertemuan</th>
                <th className="px-5 py-3">Tanggal & Jam</th>
                <th className="px-5 py-3 text-center">Tipe Sesi</th>
                <th className="px-5 py-3">Virtual Room URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 1</td>
                <td className="px-5 py-3.5 font-bold text-slate-800">Pengenalan Lingkungan Pemrograman & Logika Dasar</td>
                <td className="px-5 py-3.5">07 Sep 2026 · 08:00 - 10:30</td>
                <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">Reguler</span></td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">meet.jit.si/unsia-pjj-sesi1</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 2</td>
                <td className="px-5 py-3.5 font-bold text-slate-800">Variabel, Tipe Data & Struktur Kontrol Percabangan</td>
                <td className="px-5 py-3.5">14 Sep 2026 · 08:00 - 10:30</td>
                <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">Reguler</span></td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">meet.jit.si/unsia-pjj-sesi2</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 8 (UTS)</td>
                <td className="px-5 py-3.5 font-bold text-amber-900">Ujian Tengah Semester (UTS Online LMS)</td>
                <td className="px-5 py-3.5">26 Okt 2026 · 08:00 - 10:00</td>
                <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">UTS</span></td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">lms.unsia.ac.id/exam/uts-2026</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-800">Sesi 16 (UAS)</td>
                <td className="px-5 py-3.5 font-bold text-rose-900">Ujian Akhir Semester (UAS & Presentation)</td>
                <td className="px-5 py-3.5">18 Jan 2027 · 08:00 - 10:00</td>
                <td className="px-5 py-3.5 text-center"><span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">UAS</span></td>
                <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#0f487b]">lms.unsia.ac.id/exam/uas-2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
