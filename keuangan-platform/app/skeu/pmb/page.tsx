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

const formatRp = (v: string | number) =>
  "Rp " + Number(v).toLocaleString("id-ID");

export default function PmbDashboard() {
  const [waves, setWaves] = useState<FunnelWave[]>([]);
  const [feeRates, setFeeRates] = useState<PmbFeeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncJson, setSyncJson] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Fee CRUD state
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<PmbFeeRate | null>(null);
  const [feeForm, setFeeForm] = useState({
    waveLabel: "",
    registrationFee: "",
    examFee: "",
    reregistrationFee: "",
    matriculationFee: "",
  });
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchData = async () => {
    try {
      const [funnelRes, feesRes] = await Promise.all([
        fetch("/api/skeu/pmb/funnel"),
        fetch("/api/admin/pmb-fees"),
      ]);
      const funnelData = await funnelRes.json();
      const feesData = await feesRes.json();
      if (funnelData.success) setWaves(funnelData.funnelStats || []);
      if (feesData.success) setFeeRates(feesData.rates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcConversion = (part: number, total: number) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

  const openAddFee = () => {
    setEditingFee(null);
    setFeeForm({ waveLabel: "", registrationFee: "", examFee: "", reregistrationFee: "", matriculationFee: "" });
    setShowFeeModal(true);
  };

  const openEditFee = (rate: PmbFeeRate) => {
    setEditingFee(rate);
    setFeeForm({
      waveLabel: rate.waveLabel,
      registrationFee: rate.registrationFee,
      examFee: rate.examFee,
      reregistrationFee: rate.reregistrationFee,
      matriculationFee: rate.matriculationFee,
    });
    setShowFeeModal(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFee(true);
    try {
      const payload = editingFee
        ? { id: editingFee.id, ...feeForm }
        : feeForm;
      const method = editingFee ? "PATCH" : "POST";
      const res = await fetch("/api/admin/pmb-fees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(editingFee ? "Tarif berhasil diperbarui!" : "Tarif baru berhasil disimpan!");
        setShowFeeModal(false);
        fetchData();
      } else {
        triggerToast("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setSavingFee(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      let applicants: any[] = [];
      try {
        applicants = JSON.parse(syncJson);
      } catch {
        triggerToast("Format JSON tidak valid");
        setSyncing(false);
        return;
      }
      if (!Array.isArray(applicants) || applicants.length === 0) {
        triggerToast("Data pendaftar kosong");
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
        triggerToast(`Sinkronisasi berhasil: ${data.synced} pendaftar`);
        setShowSyncModal(false);
        setSyncJson("");
        fetchData();
      } else {
        triggerToast(data.error || "Gagal sinkronisasi");
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Penerimaan PMB</h1>
              <p className="text-xs text-slate-400 mt-1">Funnel Seleksi & Pengaturan Tarif Biaya Pendaftaran</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSyncModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
            >
              🔄 Sync dari SI-PMB
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat data PMB...</div>
        ) : (
          <>
            {/* Funnel Per Gelombang */}
            {waves.length > 0 ? waves.map((wave) => (
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
            )) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Belum ada data gelombang PMB. Sync dari SI-PMB untuk melihat data.
              </div>
            )}

            {/* Tarif Biaya PMB — Full CRUD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">💰 Tarif Biaya PMB</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tarif ini digunakan oleh SI-PMB saat membuat invoice formulir pendaftaran mahasiswa baru.</p>
                </div>
                <button
                  onClick={openAddFee}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  + Tambah Tarif Gelombang
                </button>
              </div>

              {feeRates.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs border border-slate-800 rounded-2xl">
                  Belum ada tarif PMB. Klik "+ Tambah Tarif Gelombang" untuk mengatur biaya.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Gelombang / Label</th>
                        <th className="px-4 py-3">Biaya Pendaftaran</th>
                        <th className="px-4 py-3">Biaya Ujian</th>
                        <th className="px-4 py-3">Daftar Ulang</th>
                        <th className="px-4 py-3">Matrikulasi</th>
                        <th className="px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {feeRates.map((rate) => (
                        <tr key={rate.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white">{rate.waveLabel}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400">{formatRp(rate.registrationFee)}</td>
                          <td className="py-3 px-4 font-mono">{formatRp(rate.examFee)}</td>
                          <td className="py-3 px-4 font-mono">{formatRp(rate.reregistrationFee)}</td>
                          <td className="py-3 px-4 font-mono">{formatRp(rate.matriculationFee)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openEditFee(rate)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 text-[10px] text-blue-300 space-y-1">
                <p className="font-bold text-blue-200">ℹ️ Cara Kerja Tarif PMB:</p>
                <p>• <strong>Label Gelombang</strong> harus sama persis dengan <em>Periode Akademik</em> yang diset di SI-PMB (contoh: <code className="bg-blue-900/40 px-1 rounded">2026/2027 Ganjil</code>).</p>
                <p>• Saat calon mahasiswa mendaftar, SI-PMB akan membaca tarif di tabel ini berdasarkan label gelombang untuk membuat invoice.</p>
                <p>• Jika tidak ada tarif yang cocok, sistem fallback ke biaya per <strong>Jalur Masuk</strong> yang diset di SI-PMB.</p>
              </div>
            </div>
          </>
        )}

        {/* Fee Modal */}
        {showFeeModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleSaveFee} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">
                {editingFee ? "✏️ Edit Tarif Gelombang PMB" : "➕ Tambah Tarif Gelombang PMB"}
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Label Gelombang <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: 2026/2027 Ganjil"
                  value={feeForm.waveLabel}
                  onChange={(e) => setFeeForm((p) => ({ ...p, waveLabel: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                />
                <p className="text-[9px] text-slate-500 mt-1">Harus sama dengan Periode Akademik di Gelombang SI-PMB.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "registrationFee", label: "Biaya Pendaftaran (Formulir)" },
                  { key: "examFee", label: "Biaya Ujian Seleksi" },
                  { key: "reregistrationFee", label: "Biaya Daftar Ulang" },
                  { key: "matriculationFee", label: "Biaya Matrikulasi" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={(feeForm as any)[f.key]}
                        onChange={(e) => setFeeForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFee}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {savingFee ? "Menyimpan..." : (editingFee ? "Perbarui Tarif" : "Simpan Tarif")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sync Modal */}
        {showSyncModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleSync} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">🔄 Sinkronisasi Data PMB</h3>
              <p className="text-[10px] text-slate-400">
                Tempel data JSON array pendaftar dari SI-PMB. Format: <code className="text-slate-300">[{"{"}{"fullName":"...","waveLabel":"...","registrationStatus":"...","paymentStatus":"..."}{"}"]}]</code>
              </p>
              <textarea
                required
                placeholder='[{"fullName":"Muhammad Iqbal","waveLabel":"Gelombang 1","registrationStatus":"lulus_seleksi","paymentStatus":"lunas"}]'
                value={syncJson}
                onChange={(e) => setSyncJson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 h-40 font-mono"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSyncModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer">Batal</button>
                <button type="submit" disabled={syncing} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer">{syncing ? "Menyinkronkan..." : "Sinkronkan"}</button>
              </div>
            </form>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">
            ✨ {toast}
          </div>
        )}
      </div>
    </div>
  );
}
