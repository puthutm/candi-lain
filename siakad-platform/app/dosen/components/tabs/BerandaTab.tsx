"use client";

import { ClassData, LecturerProfile } from "../page";

interface BerandaTabProps {
  lecturer: LecturerProfile | null;
  classes: ClassData[];
  submissionsCount: number;
}

export default function BerandaTab({
  lecturer,
  classes,
  submissionsCount,
}: BerandaTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Selamat Datang, {lecturer?.fullName || "Bapak/Ibu Dosen"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan aktivitas perkuliahan & bimbingan perwalian mahasiswa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Beban BKD
          </span>
          <p className="font-display font-black text-2xl text-slate-800">
            {lecturer?.bkdLoad || "12 SKS"}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Terverifikasi BAAK</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Kelas Diampu
          </span>
          <p className="font-display font-black text-2xl text-[#0f487b]">
            {classes.length} Kelas
          </p>
          <p className="text-[10px] text-blue-600 font-bold">Ganjil 2026/2027</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Perwalian Pending
          </span>
          <p className="font-display font-black text-2xl text-amber-700">
            {submissionsCount} Mhs
          </p>
          <p className="text-[10px] text-amber-600 font-bold">Validasi KRS Mahasiswa</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Status NIDN
          </span>
          <p className="font-display font-bold text-sm text-emerald-700 font-mono mt-1">
            {lecturer?.nidn || "0421098501"}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Dosen Tetap Active</p>
        </div>
      </div>
    </div>
  );
}
