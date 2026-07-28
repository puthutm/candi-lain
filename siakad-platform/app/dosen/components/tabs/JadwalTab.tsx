"use client";

import { ClassData } from "../page";

interface JadwalTabProps {
  classes: ClassData[];
  triggerToast: (msg: string) => void;
}

export default function JadwalTab({ classes, triggerToast }: JadwalTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Jadwal Perkuliahan & Kelas Diampu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kelas aktif yang diampu semester Ganjil 2026/2027.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {classes.map((cls) => (
          <div key={cls.classId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#0f487b] font-bold">{cls.courseCode}</span>
                <h3 className="text-base font-bold text-slate-800">{cls.courseName}</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                {cls.className}
              </span>
            </div>
            <div className="text-slate-600 space-y-1 font-medium">
              <p>🎓 Beban SKS: {cls.sks} SKS</p>
              <p>👥 Peserta: {cls.enrolledCount} / {cls.capacity} Mahasiswa</p>
              <p>💻 Mode Kuliah: {cls.mode}</p>
            </div>
            <button
              onClick={() => triggerToast(`Membuka LMS kelas ${cls.courseName}`)}
              className="w-full py-2 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              🚀 Buka Kelas di LMS →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
