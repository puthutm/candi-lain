"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface SSOUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [totalApps, setTotalApps] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<SSOUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (data.success) {
        setTotalApps(data.totalApps);
        setTotalUsers(data.totalUsers);
        setTotalCategories(data.totalCategories);
        setRecentLogs(data.recentLogs || []);
        setUsersList(data.usersList || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleResetPassword = async (targetUserId: string, name: string) => {
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Sukses! Password ${name} sudah direset ke default.`);
      } else {
        triggerToast(`Gagal mereset: ${data.error}`);
      }
    } catch (err: any) {
      triggerToast("Galat jaringan.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Console Admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      <AdminSidebar activeTab="dashboard" />

      {/* Main dashboard content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col gap-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Console Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Global SSO administrative summary statistics and user directories.</p>
          </div>
        </header>

        {/* Admin Features Navigation */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a href="/admin/users" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-indigo-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">👥</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">Kelola User</p>
          </a>

          <a href="/admin/roles" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-purple-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">🎭</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">Kelola Role</p>
          </a>

          <a href="/admin/permissions" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-blue-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">🔐</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">Kelola Permission</p>
          </a>

          <a href="/admin/clients" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-emerald-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">🔑</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">OAuth2 Clients</p>
          </a>

          <a href="/admin/audit-logs" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-amber-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">📋</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">Audit Logs</p>
          </a>

          <a href="/admin/settings" className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-rose-500/30 transition flex flex-col items-center gap-2">
            <div className="text-3xl">⚙️</div>
            <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-white transition">Konfigurasi</p>
          </a>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Applications</p>
            <h3 className="text-4xl font-extrabold tracking-tight mt-2 text-indigo-400">{totalApps}</h3>
            <p className="text-xs text-slate-400 mt-2">Active client integrations</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Users</p>
            <h3 className="text-4xl font-extrabold tracking-tight mt-2 text-purple-400">{totalUsers}</h3>
            <p className="text-xs text-slate-400 mt-2">Registered identity profiles</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Data Master Categories</p>
            <h3 className="text-4xl font-extrabold tracking-tight mt-2 text-emerald-400">{totalCategories}</h3>
            <p className="text-xs text-slate-400 mt-2">Global reference tables</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* USER DIRECTORY & PASSWORD RESETS */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">Direktori Pengguna SSO</h2>
              <p className="text-xs text-slate-400 mt-0.5">Reset kata sandi pengguna langsung ke default password.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="pb-3">Nama</th>
                    <th className="pb-3">Username / Email</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-white/[0.01] transition">
                      <td className="py-3">
                        <div className="font-semibold text-white">{usr.fullName}</div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{usr.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-slate-400">{usr.username}</div>
                        <div className="text-[10px] text-slate-500">{usr.email}</div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleResetPassword(usr.id, usr.fullName)}
                          className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold rounded-lg transition"
                        >
                          Reset Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* AUDIT LOGS VIEWER */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">Recent System Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time log of security events and configurations changes.</p>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 mr-3">
                        {log.action}
                      </span>
                      <span className="text-slate-300">
                        Modified {log.entityType} ID: <span className="font-mono text-slate-400 text-[10px]">{log.entityId}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* TOAST MESSAGE */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
            <span>✨</span> {toastMsg}
          </div>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
