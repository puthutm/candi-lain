"use client";

import { AdminTab } from "../AdminSidebar";

interface NilaiTabProps {
  setActiveTab: (tab: AdminTab) => void;
  triggerToast: (msg: string) => void;
}

export default function NilaiTab({
  setActiveTab,
  triggerToast,
}: NilaiTabProps) {
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
            <h2 className="font-display font-black text-2xl">Nilai & KHS Mahasiswa</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Monitoring input nilai akhir kelas kuliah (Tugas, Kuis, UTS, UAS). <strong>14 kelas belum melengkapi input nilai</strong>.
            </p>
          </div>
          <button
            onClick={() => triggerToast("Reminder terkirim ke 14 Dosen pending input nilai!")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            🔔 Ingatkan Semua (14 Dosen)
          </button>
        </div>
      </div>

      {/* Formula Warning Callout Box (Req #6) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <span className="text-amber-600 text-base font-bold shrink-0">⚠️</span>
        <div className="flex-1 space-y-1">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Formula Komponen Evaluasi Aktif:</strong> Tugas (20%) + Kuis (10%) + UTS (30%) + UAS (40%). Perubahan bobot penilaian hanya dapat diubah di menu Pengaturan Parameter oleh Super Admin.
          </p>
          <button
            onClick={() => setActiveTab("pengaturan")}
            className="mt-1 text-[#0f487b] font-bold text-xs hover:underline"
          >
            Ubah Bobot di Pengaturan →
          </button>
        </div>
      </div>

      {/* 4 Grading KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Kelas</span>
          <p className="font-display font-black text-2xl text-slate-800">42</p>
          <p className="text-[10px] text-slate-500 font-bold">22 prodi</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Lengkap & Kunci</span>
          <p className="font-display font-black text-2xl text-emerald-700">28</p>
          <p className="text-[10px] text-emerald-600 font-bold">KHS Siap Cetak</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Pending Input</span>
          <p className="font-display font-black text-2xl text-amber-700">14</p>
          <p className="text-[10px] text-amber-600 font-bold">Deadline 3 hari lagi</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">Dosen Belum Input</span>
          <p className="font-display font-black text-2xl text-rose-700">14</p>
          <p className="text-[10px] text-rose-600 font-bold">Perlu Reminder</p>
        </div>
      </div>

      {/* Table Status Input Nilai Per Kelas */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Status Input & Publikasi KHS Per Kelas</h3>
          <span className="text-xs font-mono font-bold text-slate-500">42 Kelas Perkuliahan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kelas Kuliah</th>
                <th className="px-4 py-3">Dosen Pengampu</th>
                <th className="px-4 py-3 text-center">Jumlah Mhs</th>
                <th className="px-4 py-3 text-center">Progress Input</th>
                <th className="px-4 py-3 text-center">Deadline</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "KLS-IF201-A", mk: "IF201 · Algoritma & Struktur Data (A)", dosen: "Dr. Aulia Rahman, M.Kom.", mhs: 32, progress: "4/4 (Tugas/Kuis/UTS/UAS)", deadline: "25 Mei 2026", status: "Lengkap", locked: true },
                { id: "KLS-IF203-A", mk: "IF203 · Pemrograman Berorientasi Objek (A)", dosen: "Noviandri, S.Kom., MMSI.", mhs: 33, progress: "4/4 (Tugas/Kuis/UTS/UAS)", deadline: "25 Mei 2026", status: "Lengkap", locked: true },
                { id: "KLS-IF205-A", mk: "IF205 · Basis Data (A)", dosen: "Dr. Bayu Setiawan, M.T.", mhs: 31, progress: "3/4 (Kurang UAS)", deadline: "25 Mei 2026", status: "Pending UAS", locked: false },
                { id: "KLS-IF207-A", mk: "IF207 · Jaringan Komputer (A)", dosen: "Prof. Dr. Hendro Wijaksono", mhs: 28, progress: "2/4 (Kurang UTS & UAS)", deadline: "25 Mei 2026", status: "Pending UTS", locked: false },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {row.mk}
                    <span className="block text-[10px] font-mono text-[#0f487b]">{row.id}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.dosen}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{row.mhs}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{row.progress}</td>
                  <td className="px-4 py-3 text-center">{row.deadline}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${row.locked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {row.locked ? (
                      <button
                        onClick={() => triggerToast(`KHS kelas ${row.id} telah dikunci dan dipublikasikan!`)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        🔒 KHS Publicated
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerToast(`Reminder terkirim ke ${row.dosen}`)}
                        className="text-amber-700 font-bold hover:underline cursor-pointer"
                      >
                        🔔 Ingatkan Dosen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
