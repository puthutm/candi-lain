"use client";

import { useState, useEffect } from "react";

interface ScholarshipProgram {
  id: string;
  code: string;
  name: string;
  fundingSource: string;
  quota: number;
  nominalPerSemester: string;
  status: string;
}

interface ScholarshipRecipient {
  id: string;
  programId: string;
  studentUserId: string;
  studentNameSnapshot: string | null;
  academicPeriod: string;
  nominalAwarded: string;
  status: string;
}

interface ScholarshipDisbursement {
  id: string;
  programId: string;
  fundingSource: string;
  amount: string;
  disbursementDate: string;
  destinationBankAccount: string | null;
  notes: string | null;
}

interface ReliefRequest {
  id: string;
  invoiceId: string;
  scheme: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function BeasiswaPage() {
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [recipients, setRecipients] = useState<ScholarshipRecipient[]>([]);
  const [disbursements, setDisbursements] = useState<ScholarshipDisbursement[]>([]);
  const [reliefs, setReliefs] = useState<ReliefRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [activeTab, setActiveTab] = useState<"programs" | "penerima" | "pencairan" | "keringanan">("programs");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const [showProgModal, setShowProgModal] = useState(false);
  const [progForm, setProgForm] = useState({ code: "", name: "", fundingSource: "internal", quota: "", nominalPerSemester: "", description: "" });

  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ programId: "", studentUserId: "", studentNameSnapshot: "", academicPeriod: "", nominalAwarded: "" });

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseForm, setDisburseForm] = useState({ programId: "", fundingSource: "internal", amount: "", destinationBankAccount: "", notes: "" });

  const fetchData = async () => {
    try {
      const [progRes, relRes] = await Promise.all([
        fetch("/api/skeu/scholarships"),
        fetch("/api/skeu/relief/approvals"),
      ]);
      const progData = await progRes.json();
      const relData = await relRes.json();
      if (progData.success) setPrograms(progData.programs || []);
      if (relData.success) setReliefs(relData.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async (programId?: string) => {
    try {
      const url = programId ? `/api/skeu/scholarships/recipients?programId=${programId}` : "/api/skeu/scholarships/recipients";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setRecipients(data.recipients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDisbursements = async (programId?: string) => {
    try {
      const url = programId ? `/api/skeu/scholarships/disbursements?programId=${programId}` : "/api/skeu/scholarships/disbursements";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setDisbursements(data.disbursements || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === "penerima") {
      fetchRecipients(selectedProgramId || undefined);
    } else if (activeTab === "pencairan") {
      fetchDisbursements(selectedProgramId || undefined);
    }
  }, [activeTab, selectedProgramId]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/skeu/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...progForm, quota: Number(progForm.quota) }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Program beasiswa berhasil dibuat");
        setShowProgModal(false);
        setProgForm({ code: "", name: "", fundingSource: "internal", quota: "", nominalPerSemester: "", description: "" });
        fetchData();
      } else {
        setToast(data.error || "Gagal membuat program");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const handleCreateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) { setToast("Pilih program beasiswa terlebih dahulu"); return; }
    try {
      const res = await fetch("/api/skeu/scholarships/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientForm),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Penerima beasiswa berhasil ditambahkan");
        setShowRecipientModal(false);
        setRecipientForm({ programId: selectedProgramId, studentUserId: "", studentNameSnapshot: "", academicPeriod: "", nominalAwarded: "" });
        fetchRecipients(selectedProgramId || undefined);
      } else {
        setToast(data.error || "Gagal menambahkan penerima");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!confirm("Hapus penerima ini?")) return;
    try {
      const res = await fetch(`/api/skeu/scholarships/recipients?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setToast("Penerima berhasil dihapus");
        fetchRecipients(selectedProgramId || undefined);
      } else {
        setToast(data.error || "Gagal menghapus penerima");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) { setToast("Pilih program beasiswa terlebih dahulu"); return; }
    try {
      const res = await fetch("/api/skeu/scholarships/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(disburseForm),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Pencairan dana berhasil dicatat");
        setShowDisburseModal(false);
        setDisburseForm({ programId: selectedProgramId, fundingSource: "internal", amount: "", destinationBankAccount: "", notes: "" });
        fetchDisbursements(selectedProgramId || undefined);
        fetchData();
      } else {
        setToast(data.error || "Gagal mencatat pencairan");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const handleReliefAction = async (planId: string, action: "disetujui" | "ditolak") => {
    try {
      const res = await fetch("/api/skeu/relief/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Pengajuan berhasil ${action === "disetujui" ? "disetujui" : "ditolak"}`);
        fetchData();
      } else {
        setToast(data.error || "Gagal memproses");
      }
    } catch (err: any) { setToast(err.message); }
  };

  const schemeLabel: Record<string, string> = { cicilan_2x: "Cicilan 2x", cicilan_3x: "Cicilan 3x", penundaan_1bulan: "Penundaan 1 Bulan" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Kelola Beasiswa & Keringanan</h1>
              <p className="text-xs text-slate-400 mt-1">Program beasiswa, penerima, dan approval pengajuan keringanan</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/skeu" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl border border-slate-700 transition">← Kembali</a>
            <button onClick={() => setShowProgModal(true)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition">+ Program Baru</button>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: "programs", label: "Program Beasiswa" },
            { id: "penerima", label: "Penerima" },
            { id: "pencairan", label: "Pencairan Dana" },
            { id: "keringanan", label: "Pengajuan Keringanan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter by program (for penerima & pencairan tabs) */}
        {(activeTab === "penerima" || activeTab === "pencairan") && (
          <div className="flex items-center gap-3">
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600"
            >
              <option value="">-- Semua Program --</option>
              {programs.map((prog) => (
                <option key={prog.id} value={prog.id}>{prog.code} - {prog.name}</option>
              ))}
            </select>
            {activeTab === "penerima" && (
              <button onClick={() => setShowRecipientModal(true)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl shadow-md transition">+ Tambah Penerima</button>
            )}
            {activeTab === "pencairan" && (
              <button onClick={() => { setDisburseForm({ ...disburseForm, programId: selectedProgramId }); setShowDisburseModal(true); }} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl shadow-md transition">+ Catat Pencairan</button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat data...</div>
        ) : (
          <>
            {/* TAB: PROGRAMS */}
            {activeTab === "programs" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Daftar Program Beasiswa</h3>
                {programs.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada program.</p></div>
                ) : (
                  <div className="grid gap-3">
                    {programs.map((prog) => (
                      <div key={prog.id} className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{prog.name} <span className="text-[10px] text-slate-400">({prog.code})</span></div>
                          <p className="text-[10px] text-slate-400 mt-1">Sumber: {prog.fundingSource.toUpperCase()} | Kuota: {prog.quota} | Nominal: Rp {Number(prog.nominalPerSemester).toLocaleString("id-ID")}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${prog.status === "aktif" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border border-slate-500/30"}`}>{prog.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PENERIMA */}
            {activeTab === "penerima" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Daftar Penerima Beasiswa</h3>
                {selectedProgramId && recipients.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada penerima untuk program ini.</p></div>
                )}
                {!selectedProgramId && (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Pilih program untuk melihat penerima.</p></div>
                )}
                {recipients.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="pb-3 px-2">Mahasiswa</th>
                          <th className="pb-3 px-2">Periode</th>
                          <th className="pb-3 px-2">Nominal</th>
                          <th className="pb-3 px-2">Status</th>
                          <th className="pb-3 px-2">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {recipients.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-2 font-bold text-white">{r.studentNameSnapshot || r.studentUserId}</td>
                            <td className="py-3 px-2 font-mono text-slate-400">{r.academicPeriod}</td>
                            <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(r.nominalAwarded).toLocaleString("id-ID")}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${r.status === "aktif" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : r.status === "selesai" ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <button onClick={() => handleDeleteRecipient(r.id)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 text-[9px] font-bold rounded">Hapus</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PENCairan */}
            {activeTab === "pencairan" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Riwayat Pencairan Dana</h3>
                {!selectedProgramId ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Pilih program untuk melihat history pencairan.</p></div>
                ) : disbursements.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Belum ada pencairan untuk program ini.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="pb-3 px-2">Tanggal</th>
                          <th className="pb-3 px-2">Sumber Dana</th>
                          <th className="pb-3 px-2">Jumlah</th>
                          <th className="pb-3 px-2">Rekening Tujuan</th>
                          <th className="pb-3 px-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {disbursements.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-2 font-mono text-slate-400">{new Date(d.disbursementDate).toLocaleDateString("id-ID")}</td>
                            <td className="py-3 px-2 uppercase">{d.fundingSource}</td>
                            <td className="py-3 px-2 font-mono text-emerald-400">Rp {Number(d.amount).toLocaleString("id-ID")}</td>
                            <td className="py-3 px-2 font-mono text-slate-400">{d.destinationBankAccount || "-"}</td>
                            <td className="py-3 px-2 text-slate-400">{d.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: KERINGANAN */}
            {activeTab === "keringanan" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Pengajuan Keringanan Menunggu Approval</h3>
                {reliefs.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 text-xs">Tidak ada pengajuan tertunda.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                        <tr><th className="pb-3 px-2">Tanggal</th><th className="pb-3 px-2">Invoice</th><th className="pb-3 px-2">Skema</th><th className="pb-3 px-2">Alasan</th><th className="pb-3 px-2">Status</th><th className="pb-3 px-2">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {reliefs.map((rel) => (
                          <tr key={rel.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-2 font-mono text-slate-400">{new Date(rel.createdAt).toLocaleDateString("id-ID")}</td>
                            <td className="py-3 px-2 font-mono text-slate-400">{rel.invoiceId.slice(0, 8)}...</td>
                            <td className="py-3 px-2">{schemeLabel[rel.scheme] || rel.scheme}</td>
                            <td className="py-3 px-2 text-slate-400 max-w-[200px] truncate">{rel.reason}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${rel.status === "disetujui" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : rel.status === "ditolak" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : rel.status === "berjalan" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                                {rel.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              {rel.status === "diajukan" && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleReliefAction(rel.id, "disetujui")} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded">Setujui</button>
                                  <button onClick={() => handleReliefAction(rel.id, "ditolak")} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-bold rounded">Tolak</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showProgModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateProgram} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">🎓 Program Beasiswa Baru</h3>
              <input required placeholder="Kode Program (mis. KIP-K-2026)" value={progForm.code} onChange={(e) => setProgForm({ ...progForm, code: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input required placeholder="Nama Program" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <select value={progForm.fundingSource} onChange={(e) => setProgForm({ ...progForm, fundingSource: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600">
                <option value="internal">Internal</option>
                <option value="kip_k">KIP-K</option>
                <option value="mitra">Mitra</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Kuota" value={progForm.quota} onChange={(e) => setProgForm({ ...progForm, quota: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
                <input required placeholder="Nominal per Semester" value={progForm.nominalPerSemester} onChange={(e) => setProgForm({ ...progForm, nominalPerSemester: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowProgModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">Simpan Program</button>
              </div>
            </form>
          </div>
        )}

        {showRecipientModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleCreateRecipient} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">🎓 Tambah Penerima Beasiswa</h3>
              <input required placeholder="Student User ID" value={recipientForm.studentUserId} onChange={(e) => setRecipientForm({ ...recipientForm, studentUserId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input placeholder="Nama Mahasiswa (snapshot)" value={recipientForm.studentNameSnapshot} onChange={(e) => setRecipientForm({ ...recipientForm, studentNameSnapshot: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input required placeholder="Periode Akademik" value={recipientForm.academicPeriod} onChange={(e) => setRecipientForm({ ...recipientForm, academicPeriod: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input required type="number" placeholder="Nominal yang Diberikan" value={recipientForm.nominalAwarded} onChange={(e) => setRecipientForm({ ...recipientForm, nominalAwarded: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRecipientModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition">Simpan Penerima</button>
              </div>
            </form>
          </div>
        )}

        {showDisburseModal && (
          <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
            <form onSubmit={handleDisburse} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-white text-sm">💸 Catat Pencairan Dana</h3>
              <select required value={disburseForm.fundingSource} onChange={(e) => setDisburseForm({ ...disburseForm, fundingSource: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600">
                <option value="internal">Internal</option>
                <option value="kip_k">KIP-K</option>
                <option value="mitra">Mitra</option>
              </select>
              <input required type="number" placeholder="Jumlah Pencairan" value={disburseForm.amount} onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input placeholder="Rekening Tujuan (opsional)" value={disburseForm.destinationBankAccount} onChange={(e) => setDisburseForm({ ...disburseForm, destinationBankAccount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <input placeholder="Keterangan (opsional)" value={disburseForm.notes} onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDisburseModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition">Simpan Pencairan</button>
              </div>
            </form>
          </div>
        )}

        {toast && <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">✨ {toast}</div>}
      </div>
    </div>
  );
}
