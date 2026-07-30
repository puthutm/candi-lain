"use client";

import { useState } from "react";

interface SeleksiPanelProps {
  applicants: any[];
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
}

export default function SeleksiPanel({ applicants, triggerToast, refreshData }: SeleksiPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState("all");
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");

  const handleUpdateStatus = async (applicantId: string, currentStage: string, fullName: string) => {
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, currentStage }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = currentStage === "diterima" 
          ? `Pendaftar ${fullName} disetujui DITERIMA! NIM telah diterbitkan.` 
          : `Status ${fullName} diubah menjadi DITOLAK.`;
        triggerToast(msg);
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

  const handleSaveScore = async (applicantId: string, fullName: string) => {
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, totalExamScore: parseInt(scoreInput || "0", 10) }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Skor CBT untuk ${fullName} berhasil diperbarui menjadi ${scoreInput}!`);
        setEditingScoreId(null);
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal memperbarui skor CBT: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = applicants.filter((a) => {
    if (filterStage === "all") return true;
    if (filterStage === "diterima") return a.currentStage === "diterima";
    if (filterStage === "ditolak") return a.currentStage === "ditolak";
    if (filterStage === "pending") return a.currentStage !== "diterima" && a.currentStage !== "ditolak";
    return true;
  });

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Hasil Ujian CBT & Penilaian Seleksi Kelulusan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar skor hasil ujian CBT pendaftar & rekomendasi kelulusan panitia BAAK.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-slate-500">Filter Status:</span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Semua Pendaftar ({applicants.length})</option>
            <option value="pending">Menunggu Keputusan</option>
            <option value="diterima">Diterima (Lulus)</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                  Tidak ada pendaftar pada kategori seleksi ini.
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const score = a.totalExamScore || 85;
                const isAccepted = a.currentStage === "diterima";
                const isRejected = a.currentStage === "ditolak";

                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{a.registrationNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {a.fullName}
                      {a.nim && (
                        <span className="block text-[10px] font-mono text-emerald-700">NIM: {a.nim}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{a.studyProgram}</td>
                    <td className="px-4 py-3 text-center">
                      {editingScoreId === a.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={scoreInput}
                            onChange={(e) => setScoreInput(e.target.value)}
                            className="w-16 p-1 border border-blue-400 rounded text-center font-mono font-bold outline-none"
                          />
                          <button
                            onClick={() => handleSaveScore(a.id, a.fullName)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingScoreId(a.id);
                            setScoreInput(String(score));
                          }}
                          className="font-mono font-bold text-slate-800 hover:text-blue-600 cursor-pointer underline"
                          title="Klik untuk edit skor CBT"
                        >
                          {score} / 100 ✏️
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800"
                            : isRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isAccepted ? "✓ Diterima" : isRejected ? "✕ Ditolak" : score >= 60 ? "Direkomendasikan Lulus" : "Pertimbangan khusus"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {!isAccepted && !isRejected && (
                        <button
                          disabled={loadingId === a.id}
                          onClick={() => handleUpdateStatus(a.id, "ditolak", a.fullName)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 cursor-pointer transition-all"
                        >
                          Tolak
                        </button>
                      )}
                      <button
                        disabled={loadingId === a.id || isAccepted}
                        onClick={() => handleUpdateStatus(a.id, "diterima", a.fullName)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        {loadingId === a.id ? "Memproses..." : isAccepted ? "✓ Lulus (NIM Issued)" : "Setujui Lulus →"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
