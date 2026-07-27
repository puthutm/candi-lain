"use client";

import { useState, useEffect } from "react";

interface FunnelWave {
  waveLabel: string;
  total: number;
  pendaftar: number;
  bayarFormulir: number;
  ikutUjian: number;
  lulusSeleksi: number;
  daftarUlang: number;
}

interface PmbFeeRate {
  id: string;
  waveLabel: string;
  registrationFee: string;
  examFee: string;
  reregistrationFee: string;
  matriculationFee: string;
}

export default function PmbDashboard() {
  const [waves, setWaves] = useState<FunnelWave[]>([]);
  const [feeRates, setFeeRates] = useState<PmbFeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncJson, setSyncJson] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/skeu/pmb/funnel");
      const result = await res.json();
      if (result.success) {
        setWaves(result.funnelStats || []);
        setFeeRates(result.feeRates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcConversion = (part: number, total: number) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      let applicants: any[] = [];
      try {
        applicants = JSON.parse(syncJson);
      } catch {
        setToast("Format JSON tidak valid");
        setSyncing(false);
        return;
      }
      if (!Array.isArray(applicants) || applicants.length === 0) {
        setToast("Data pendaftar kosong");
        setSyncing(false);
        return;
      }
      const res = await fetch("/api/skeu/pmb/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicants }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Sinkronisasi berhasil: ${data.synced} pendaftar`);
        setShowSyncModal(false);
        setSyncJson("");
        fetchData();
      } else {
        setToast(data.error || "Gagal sinkronisasi");
      }
    } catch (err: any) {
      setToast(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-3 pb-5 border-b border-slate-800">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Penerimaan PMB</h1>
            <p className="text-xs text-slate-400 mt-1">Ringkasan Funnel & Tarif Pendaftaran</p>
          </div>
          <button onClick={() => setShowSyncModal(true)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition">
            🔄 Sync dari SI-PMB
          </button>
        </header>

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat data PMB...</div>
        ) : (
          <>
            {/* Funnel Per Gelombang */}
            {waves.map((wave) => (
              <div key={wave.waveLabel} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>📈</span> Gelombang: {wave.waveLabel}
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: "Pendaftar", value: wave.pendaftar, pct: "100" },
                    { label: "Bayar Formulir", value: wave.bayarFormulir, pct: calcConversion(wave.bayarFormulir, wave.pendaftar) },
                    { label: "Ikut Ujian", value: wave.ikutUjian, pct: calcConversion(wave.ikutUjian, wave.pendaftar) },
                    { label: "Lulus Seleksi", value: wave.lulusSeleksi, pct: calcConversion(wave.lulusSeleksi, wave.pendaftar) },
                    { label: "Daftar Ulang", value: wave.daftarUlang, pct: calcConversion(wave.daftarUlang, wave.pendaftar) },
                  ].map((stage) => (
                    <div key={stage.label} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-white">{stage.value}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{stage.label}</div>
                      <div className="text-[9px] font-bold text-emerald-400 mt-1">{stage.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Tarif PMB */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">💰 Tarif Biaya PMB</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="pb-3 px-2">Gelombang</th>
                      <th className="pb-3 px-2">Pendaftaran</th>
                      <th className="pb-3 px-2">Ujian</th>
                      <th className="pb-3 px-2">Daftar Ulang</th>
                      <th className="pb-3 px-2">Matrikulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {feeRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-2 font-bold text-white">{rate.waveLabel}</td>
                        <td className="py-3 px-2 font-mono">Rp {Number(rate.registrationFee).toLocaleString("id-ID")}</td>
                        <td className="py-3 px-2 font-mono">Rp {Number(rate.examFee).toLocaleString("id-ID")}</td>
                        <td className="py-3 px-2 font-mono">Rp {Number(rate.reregistrationFee).toLocaleString("id-ID")}</td>
                        <td className="py-3 px-2 font-mono">Rp {Number(rate.matriculationFee).toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {showSyncModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleSync} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">🔄 Sinkronisasi Data PMB</h3>
              <p className="text-[10px] text-slate-400">Tempel data JSON array pendaftar dari SI-PMB. Format: <code className="text-slate-300">[{"{"}"fullName":"...","waveLabel":"...","registrationStatus":"...","paymentStatus":"..."{"}"}]</code></p>
              <textarea
                required
                placeholder='[{"fullName":"Muhammad Iqbal","waveLabel":"Gelombang 1","registrationStatus":"lulus_seleksi","paymentStatus":"lunas"}]'
                value={syncJson}
                onChange={(e) => setSyncJson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 h-40 font-mono"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSyncModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition">Batal</button>
                <button type="submit" disabled={syncing} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">{syncing ? "Menyinkronkan..." : "Sinkronkan"}</button>
              </div>
            </form>
          </div>
        )}

        {toast && <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">✨ {toast}</div>}
      </div>
    </div>
  );
}
