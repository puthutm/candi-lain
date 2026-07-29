"use client";

import { useState, useEffect } from "react";

interface PddiktiTabProps {
  triggerToast: (msg: string) => void;
}

export default function PddiktiTab({ triggerToast }: PddiktiTabProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/pddikti/sync");
      const data = await res.json();
      if (data.success) {
        setStatusData(data);
      }
    } catch {}
  };

  const handleRunSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/admin/pddikti/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "all" }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult(data.summary);
        triggerToast("🚀 Sync Feeder PDDikti berhasil dieksekusi!");
        fetchStatus();
      } else {
        triggerToast(`❌ Sync PDDikti gagal: ${data.error}`);
      }
    } catch (err: any) {
      triggerToast(`❌ Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#FED524] uppercase tracking-widest block mb-1">
            Feeder Integrator v2.0
          </span>
          <h2 className="text-xl font-bold font-display">Sinkronisasi Feeder PDDikti Kemdikbud</h2>
          <p className="text-xs text-blue-100 mt-1">
            Mendorong data Mahasiswa, Mata Kuliah, & Nilai Akademik langsung ke Server PDDikti Pusat.
          </p>
        </div>
        <button
          onClick={handleRunSync}
          disabled={syncing}
          className="px-5 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
        >
          {syncing ? "⏳ Prosessing Sync..." : "🚀 Jalankan Sync PDDikti"}
        </button>
      </div>

      {statusData && (
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 block font-bold">TOTAL MAHASISWA</span>
            <span className="text-lg font-bold text-slate-800">{statusData.counts?.students || 0} Data</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 block font-bold">TOTAL MATA KULIAH</span>
            <span className="text-lg font-bold text-slate-800">{statusData.counts?.courses || 0} Data</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-400 block font-bold">TOTAL REKAP NILAI</span>
            <span className="text-lg font-bold text-slate-800">{statusData.counts?.grades || 0} Data</span>
          </div>
        </div>
      )}

      {syncResult && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-emerald-400 font-bold">✓ PDDikti Web Service Handshake Success</span>
            <span className="text-[10px] text-slate-500">{syncResult.syncedAt}</span>
          </div>
          <div className="space-y-1">
            <p>Session Token ID: <span className="text-yellow-400 font-bold">{syncResult.sessionId}</span></p>
            <p>Target Server: <span className="text-blue-400">{syncResult.environment}</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 text-[11px]">
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[9px]">MAHASISWA</span>
              <span className="text-emerald-400 font-bold">{syncResult.results.mahasiswa.synced} Synced</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[9px]">MATAKULIAH</span>
              <span className="text-emerald-400 font-bold">{syncResult.results.matakuliah.synced} Synced</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <span className="text-slate-400 block text-[9px]">NILAI AKADEMIK</span>
              <span className="text-emerald-400 font-bold">{syncResult.results.nilaiAkademik.synced} Synced</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
