"use client";

import { useState } from "react";

interface SeleksiPanelProps {
  applicants: any[];
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
}

export default function SeleksiPanel({ applicants, triggerToast, refreshData }: SeleksiPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (applicantId: string, fullName: string) => {
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, currentStage: "diterima" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Pendaftar ${fullName} berhasil disetujui DITERIMA! NIM telah diterbitkan.`);
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal mengubah status: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Hasil Ujian CBT & Penilaian Seleksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar skor hasil ujian CBT pendaftar & rekomendasi kelulusan BAAK.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">No. Reg</th>
              <th className="px-4 py-3">Nama Pendaftar</th>
              <th className="px-4 py-3">Prodi Pilihan</th>
              <th className="px-4 py-3 text-center">Skor Ujian CBT</th>
              <th className="px-4 py-3 text-center">Rekomendasi</th>
              <th className="px-4 py-3 text-right">Aksi Kelulusan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applicants.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-blue-700">{a.registrationNumber}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{a.fullName}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{a.studyProgram}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                  {a.totalExamScore || "85 / 100"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                    {a.passingRecommendation || "Direkomendasikan Lulus"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    disabled={loadingId === a.id || a.currentStage === "diterima"}
                    onClick={() => handleApprove(a.id, a.fullName)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {loadingId === a.id ? "Memproses..." : a.currentStage === "diterima" ? "✓ Diterima" : "Setujui Lulus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
