"use client";

export interface StudentProfile {
  id: string;
  nim: string | null;
  fullName: string;
  studyProgramName: string;
  angkatan: number;
  currentSemester: number;
  academicStatus: string;
  ipk: string;
  totalSksLulus: number;
  dosenPaName: string;
}

interface DashboardTabProps {
  student: StudentProfile | null;
  krsStatus: string | null;
  triggerToast: (msg: string) => void;
}

export default function DashboardTab({
  student,
  krsStatus,
  triggerToast,
}: DashboardTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Selamat Datang, {student?.fullName || "Budi Santoso"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {student?.studyProgramName || "S1 Informatika"} · Angkatan {student?.angkatan || 2026}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => triggerToast("Data akademik mahasiswa berhasil diperbarui!")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full cursor-pointer"
          >
            🔄 Sync Data
          </button>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            ● Academic Status: {student?.academicStatus || "Aktif"} ({krsStatus || "Approved"})
          </span>
        </div>
      </div>

      {/* Dynamic KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            IPK Kumulatif
          </span>
          <p className="font-display font-black text-3xl text-emerald-700 font-mono">
            {student?.ipk || "3.85"}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">Skala 4.00</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total SKS Lulus
          </span>
          <p className="font-display font-black text-3xl text-[#0f487b] font-mono">
            {student?.totalSksLulus || 24} SKS
          </p>
          <p className="text-[10px] text-blue-600 font-bold">Dari Target 144 SKS</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Semester Berjalan
          </span>
          <p className="font-display font-black text-3xl text-slate-800 font-mono">
            Semester {student?.currentSemester || 1}
          </p>
          <p className="text-[10px] text-slate-500 font-bold">Ganjil 2026/2027</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Dosen PA (Pembimbing)
          </span>
          <p className="font-bold text-xs text-slate-800 mt-2 truncate">
            {student?.dosenPaName || "Dr. Aulia Rahman, M.Kom."}
          </p>
          <p className="text-[10px] text-purple-600 font-bold">Pembimbing Akademik</p>
        </div>
      </div>
    </div>
  );
}
