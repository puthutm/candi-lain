"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 25;

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI state for expandable metadata
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (actionFilter) params.append("action", actionFilter);
      if (entityFilter) params.append("entityType", entityFilter);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setActionFilter("");
    setEntityFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionColor = (action: string) => {
    if (action.includes("SUCCESS") || action.includes("CREATED") || action.includes("ASSIGNED")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("FAILURE") || action.includes("REVOKED") || action.includes("DELETE")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="audit-logs" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="pb-6 border-b border-white/10">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Lacak dan audit riwayat aktivitas sistem, perubahan konfigurasi, serta kejadian keamanan untuk kepatuhan & debugging.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="">Semua Aksi</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="ROLE_CREATED">ROLE_CREATED</option>
                <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
                <option value="ROLE_REVOKED">ROLE_REVOKED</option>
                <option value="UPDATE">UPDATE</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Entity Type</label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="">Semua Entitas</option>
                <option value="user">user</option>
                <option value="application">application</option>
                <option value="role">role</option>
                <option value="system_settings">system_settings</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500/50 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500/50 cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 font-semibold text-slate-300 transition"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02] gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Memuat audit log...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-lg text-white">Tidak Ada Aktivitas</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Belum ada aktivitas yang terekam atau tidak ada log yang cocok dengan filter Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Waktu</th>
                      <th className="p-4">Aksi</th>
                      <th className="p-4">Tipe Entitas</th>
                      <th className="p-4">ID Entitas</th>
                      <th className="p-4">Aktor (User ID)</th>
                      <th className="p-4 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors align-top">
                        <td className="p-4 whitespace-nowrap text-slate-400">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td className="p-4 font-mono font-semibold">
                          <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-medium">{log.entityType}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-500 max-w-[150px] truncate">{log.entityId}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-400">{log.actorUserId}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                          >
                            {expandedLogId === log.id ? "Sembunyikan" : "Metadata"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Collapsible Metadata Drawer */}
              {expandedLogId && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg animate-fadeIn space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-indigo-400">Metadata Payload untuk Log ID: {expandedLogId}</span>
                    <button
                      onClick={() => setExpandedLogId(null)}
                      className="text-[10px] text-slate-500 hover:text-white"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-4 rounded-xl overflow-x-auto border border-white/5">
                    {JSON.stringify(logs.find(l => l.id === expandedLogId)?.metadata, null, 2) || "Tidak ada metadata tambahan."}
                  </pre>
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-xs">
                <span className="text-slate-400">
                  Menampilkan <span className="font-semibold text-white">{logs.length}</span> log dari total <span className="font-semibold text-white">{total}</span> aktivitas
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">Halaman {page} dari {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-bold hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      &larr; Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-bold hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
