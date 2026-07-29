"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  user: string;
  action: string;
  module: string;
  time: string;
}

export default function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (data.success) {
        setLogs([
          {
            user: "Admin SIAKAD System",
            action: "System Security & Database Healthcheck",
            module: "SIAKAD Engine",
            time: "Baru saja",
          },
        ]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <h2 className="text-xl font-bold text-slate-800">Audit Logs & Activity Stream</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">Memuat log audit...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold">Belum ada riwayat log audit.</div>
        ) : (
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-5 py-3">Pengguna</th>
                <th className="px-5 py-3">Aksi Log</th>
                <th className="px-5 py-3">Modul</th>
                <th className="px-5 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-800">{log.user}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">{log.action}</td>
                  <td className="px-5 py-4 font-mono font-bold">{log.module}</td>
                  <td className="px-5 py-4 text-slate-400 font-mono">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
