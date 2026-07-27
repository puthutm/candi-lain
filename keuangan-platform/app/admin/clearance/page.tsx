"use client";

import { useState, useEffect } from "react";

interface ClearanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  nim: string;
  prodi: string;
  status: "aktif" | "tertahan";
  overdueCount: number;
  lastCheckedAt: string;
}

export default function AdminClearanceDashboard() {
  const [clearances, setClearances] = useState<ClearanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "aktif" | "tertahan">("all");
  const [toast, setToast] = useState("");

  const fetchClearanceData = async () => {
    try {
      const res = await fetch("/api/skeu/invoices");
      const result = await res.json();
      if (result.success && result.invoices) {
        // Derive clearance status per student from invoices
        const studentMap: Record<string, ClearanceRecord> = {};
        for (const inv of result.invoices) {
          const sId = inv.studentId || inv.id;
          if (!studentMap[sId]) {
            studentMap[sId] = {
              id: inv.id,
              studentId: sId,
              studentName: inv.studentName || `Mahasiswa (${inv.studentId.slice(0, 8)})`,
              nim: inv.nim || "2026550001",
              prodi: inv.prodi || "Informatika (S1)",
              status: inv.status === "overdue" ? "tertahan" : "aktif",
              overdueCount: inv.status === "overdue" ? 1 : 0,
              lastCheckedAt: new Date().toISOString(),
            };
          } else if (inv.status === "overdue") {
            studentMap[sId].status = "tertahan";
            studentMap[sId].overdueCount += 1;
          }
        }
        setClearances(Object.values(studentMap));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearanceData();
  }, []);

  const handleToggleClearance = async (record: ClearanceRecord) => {
    const newStatus = record.status === "tertahan" ? "aktif" : "tertahan";
    try {
      const res = await fetch("/api/skeu/clearance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: record.studentId,
          overrideStatus: newStatus,
          reason: "Manual override clearance oleh Admin Keuangan",
        }),
      });
      const result = await res.json();
      if (result.success) {
        setToast(`Status clearance ${record.studentName} diubah menjadi "${newStatus}"!`);
        await fetchClearanceData();
      } else {
        setToast(result.error || "Gagal mengubah clearance");
      }
    } catch (err: any) {
      setToast(err.message);
    }
  };

  const filteredClearances = clearances.filter((c) => {
    if (filterStatus === "aktif") return c.status === "aktif";
    if (filterStatus === "tertahan") return c.status === "tertahan";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Monitoring Clearance Finansial Admin</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Pemantauan & Reversal Status Kelayakan Finansial Mahasiswa SIAKAD/LMS</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold px-3 py-1.5 rounded-xl">
              SKEU Admin Panel
            </span>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex gap-2">
            {(["all", "aktif", "tertahan"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                  filterStatus === st
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                }`}
              >
                {st === "all" ? "Semua Status" : st === "aktif" ? "✓ Aktif (Bebas)" : "⚠️ Tertahan (Overdue)"}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchClearanceData()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Clearance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎓</span> Daftar Status Clearance Mahasiswa
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat status clearance...</div>
          ) : filteredClearances.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Tidak ada data mahasiswa terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 px-2">Nama Mahasiswa</th>
                    <th className="pb-3 px-2">NIM</th>
                    <th className="pb-3 px-2">Prodi</th>
                    <th className="pb-3 px-2">Tunggakan Overdue</th>
                    <th className="pb-3 px-2">Status Clearance</th>
                    <th className="pb-3 px-2 text-right">Manual Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {filteredClearances.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-2 font-bold text-white">{c.studentName}</td>
                      <td className="py-3.5 px-2 font-mono text-slate-400">{c.nim}</td>
                      <td className="py-3.5 px-2">{c.prodi}</td>
                      <td className="py-3.5 px-2 font-bold text-amber-400">{c.overdueCount} Tagihan</td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            c.status === "aktif"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {c.status === "aktif" ? "✓ AKTIF (BEBAS)" : "⚠️ TERTAHAN (BLOCKED)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => handleToggleClearance(c)}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition border ${
                            c.status === "tertahan"
                              ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {c.status === "tertahan" ? "🔓 Unblock (Bebaskan)" : "🔒 Block Clearance"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">
          ✨ {toast}
        </div>
      )}
    </div>
  );
}
