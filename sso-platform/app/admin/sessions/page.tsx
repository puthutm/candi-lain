"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
  ipAddress: string;
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 5000);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.list)) {
        setSessions(data.list);
      } else {
        setSessions([]);
      }
    } catch {
      showToast("Gagal memuat daftar sesi aktif", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleKillSession = async (sessionId: string) => {
    if (!confirm("Apakah Anda yakin ingin memutus/mencabut sesi ini?")) return;

    try {
      const res = await fetch(`/api/admin/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Sesi berhasil diputuskan!");
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } else {
        showToast(data.error || "Gagal memutus sesi", "error");
      }
    } catch {
      showToast("Gagal menghubungi server", "error");
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="sessions" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Toast */}
        {toastMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
              toastType === "error"
                ? "bg-rose-950/90 border-rose-800 text-rose-200"
                : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{toastType === "error" ? "⚠️" : "✅"}</span>
              <p className="text-xs font-bold tracking-wide">{toastMsg}</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Monitoring Sesi Aktif</h1>
              <p className="mt-1 text-slate-400 text-sm">
                Pantau seluruh sesi pengguna yang sedang online di ekosistem ERP UNSIA dan lakukan pemutusan sesi paksa (*remote kill*).
              </p>
            </div>
            <button
              onClick={fetchSessions}
              className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition flex items-center gap-2"
            >
              <span>🔄</span> Refresh Sesi
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />
            <span className="text-xs font-mono text-slate-400">
              Total Sesi Aktif: <strong className="text-emerald-400 font-bold">{sessions.length}</strong>
            </span>
          </div>

          {/* Sessions Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                Memuat sesi aktif dari Redis...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 italic">
                Tidak ada sesi login aktif yang ditemukan.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Pengguna</th>
                    <th className="px-6 py-4">Perangkat / IP</th>
                    <th className="px-6 py-4">Waktu Dibuat</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{s.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{s.username} • {s.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-slate-300 truncate max-w-xs">{s.userAgent}</div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5">IP: {s.ipAddress}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {new Date(s.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleKillSession(s.id)}
                          className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 transition"
                        >
                          ⛔ Putuskan Sesi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
