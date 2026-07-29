"use client";

import { useEffect, useState, use } from "react";

interface VerificationData {
  verified: boolean;
  verifiedAt: string;
  institution: string;
  student: {
    nim: string;
    fullName: string;
    prodiName: string;
    prodiCode: string;
    angkatan: number;
    currentSemester: number;
    academicStatus: string;
    ipk: string;
    totalSksLulus: number;
  };
  grades: {
    id: string;
    courseCode: string;
    courseName: string;
    sks: number;
    finalScore: string;
    letterGrade: string;
    gradePoint: string;
  }[];
}

export default function TranscriptVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/verify/transcript/${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Dokumen tidak ditemukan");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memverifikasi dokumen");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Memverifikasi Dokumen Akademis UNSIA...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-rose-500/30 text-center space-y-4 shadow-xl">
          <span className="text-4xl block">❌</span>
          <h2 className="text-lg font-bold text-rose-400">Verifikasi Gagal</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          <div className="pt-2 text-[10px] text-slate-500 font-mono">
            Universitas Siber Asia · Sistem Penjaminan Mutu Akademik
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Verification Status Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-black shrink-0">
              ✓
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase block">
                Official Validation Authenticated
              </span>
              <h1 className="text-lg font-black text-white font-display">
                DOKUMEN RESMI TERVERIFIKASI
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Diterbitkan oleh {data.institution}
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-400">
            <div>Waktu Verifikasi:</div>
            <div className="font-bold text-emerald-400">
              {new Date(data.verifiedAt).toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Student Profile Info Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4 shadow-lg text-xs">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-3 flex items-center justify-between">
            <span>👤 Identitas Mahasiswa</span>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold rounded-full text-[10px]">
              NIM: {data.student.nim}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-medium text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Lengkap</span>
              <span className="font-bold text-white text-sm">{data.student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Program Studi</span>
              <span className="font-bold text-white">{data.student.prodiName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Angkatan / Semester</span>
              <span className="font-bold text-white">{data.student.angkatan} / Semester {data.student.currentSemester}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Indeks Prestasi Kumulatif (IPK)</span>
              <span className="font-bold text-[#FED524] text-base">{data.student.ipk}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total SKS Lulus</span>
              <span className="font-bold text-white">{data.student.totalSksLulus} SKS</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Akademik</span>
              <span className="px-2.5 py-0.5 bg-emerald-900/50 text-emerald-300 font-bold rounded-full text-[10px]">
                ● {data.student.academicStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Grade Transcript Table */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden shadow-lg text-xs">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-200">📜 Daftar Nilai Transkrip Akademik</h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {data.grades.length} Mata Kuliah
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-900/50 font-bold text-slate-400 border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Kode MK</th>
                  <th className="px-4 py-3">Nama Mata Kuliah</th>
                  <th className="px-4 py-3 text-center">SKS</th>
                  <th className="px-4 py-3 text-center">Nilai Mutu</th>
                  <th className="px-4 py-3 text-center">Bobot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.grades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{g.courseCode}</td>
                    <td className="px-4 py-3 font-semibold text-white">{g.courseName}</td>
                    <td className="px-4 py-3 text-center font-bold">{g.sks}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#FED524]">{g.letterGrade || "A"}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{g.gradePoint || "4.00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center text-[10px] text-slate-500 space-y-1 font-mono pt-4 border-t border-slate-800">
          <p>Dokumen ini diterbitkan secara otomatis oleh SIAKAD Engine Universitas Siber Asia (UNSIA).</p>
          <p>Authenticity Check ID: <span className="text-slate-400 font-bold">{id}</span></p>
        </div>
      </div>
    </div>
  );
}
