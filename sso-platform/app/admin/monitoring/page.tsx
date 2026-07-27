"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface TokenUsageData {
  activeTokens: number;
  revokedTokens: number;
  tokensPerApp: Array<{ appId: string; appName: string; count: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
  period: { days: number; since: string };
}

interface FailedLoginData {
  totalFailed: number;
  dailyFailed: Array<{ date: string; count: number }>;
  topFailedUsers: Array<{ metadata: string; count: number }>;
  recentFailed: Array<{ id: string; actorUserId: string | null; metadata: string; createdAt: string }>;
  period: { days: number; since: string };
}

export default function MonitoringPage() {
  const [tokenData, setTokenData] = useState<TokenUsageData | null>(null);
  const [loginData, setLoginData] = useState<FailedLoginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = async (d: number) => {
    setLoading(true);
    try {
      const [tokenRes, loginRes] = await Promise.all([
        fetch(`/api/admin/monitoring/token-usage?days=${d}`),
        fetch(`/api/admin/monitoring/failed-logins?days=${d}`),
      ]);
      if (tokenRes.ok) setTokenData(await tokenRes.json());
      if (loginRes.ok) setLoginData(await loginRes.json());
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      <AdminSidebar activeTab="monitoring" />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
            <p className="text-slate-400 text-sm mt-1">Token usage, failed logins, and system observability.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Token Usage Section */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
              <h2 className="text-lg font-bold">Token Usage</h2>
              <p className="text-xs text-slate-400 mt-0.5">Active tokens, issuance trends, and per-application distribution.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Tokens</p>
                  <p className="text-2xl font-extrabold text-indigo-400 mt-1">{tokenData?.activeTokens ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revoked</p>
                  <p className="text-2xl font-extrabold text-rose-400 mt-1">{tokenData?.revokedTokens ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Apps</p>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-1">{tokenData?.tokensPerApp?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Period (days)</p>
                  <p className="text-2xl font-extrabold text-purple-400 mt-1">{days}</p>
                </div>
              </div>

              {/* Tokens per App */}
              {tokenData?.tokensPerApp && tokenData.tokensPerApp.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Tokens Issued Per Application</h3>
                  <div className="space-y-2">
                    {tokenData.tokensPerApp.map((app) => (
                      <div key={app.appId} className="flex items-center justify-between rounded-lg bg-slate-900/20 px-4 py-2.5">
                        <span className="text-sm text-slate-300">{app.appName}</span>
                        <span className="text-sm font-bold text-indigo-400">{app.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Usage Chart (simple bar representation) */}
              {tokenData?.dailyUsage && tokenData.dailyUsage.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Daily Token Issuance</h3>
                  <div className="flex items-end gap-1 h-24">
                    {tokenData.dailyUsage.map((day) => {
                      const maxCount = Math.max(...tokenData.dailyUsage.map((d) => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1"
                          title={`${day.date}: ${day.count} tokens`}
                        >
                          <div
                            className="w-full rounded-t bg-indigo-500/60 hover:bg-indigo-500/80 transition"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-[8px] text-slate-500 truncate w-full text-center">
                            {new Date(day.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Failed Logins Section */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
              <h2 className="text-lg font-bold">Failed Logins</h2>
              <p className="text-xs text-slate-400 mt-0.5">Authentication failure tracking and suspicious activity monitoring.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Failed</p>
                  <p className="text-2xl font-extrabold text-rose-400 mt-1">{loginData?.totalFailed ?? 0}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Avg</p>
                  <p className="text-2xl font-extrabold text-amber-400 mt-1">
                    {loginData?.dailyFailed?.length
                      ? Math.round(loginData.totalFailed / loginData.dailyFailed.length)
                      : 0}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unique Users</p>
                  <p className="text-2xl font-extrabold text-purple-400 mt-1">{loginData?.topFailedUsers?.length ?? 0}</p>
                </div>
              </div>

              {/* Top Failed Users */}
              {loginData?.topFailedUsers && loginData.topFailedUsers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Top Failed Attempts</h3>
                  <div className="space-y-2">
                    {loginData.topFailedUsers.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-900/20 px-4 py-2.5">
                        <span className="text-sm text-slate-300 font-mono">{user.metadata}</span>
                        <span className="text-sm font-bold text-rose-400">{user.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Failed Attempts */}
              {loginData?.recentFailed && loginData.recentFailed.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Recent Failed Attempts</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {loginData.recentFailed.map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between rounded-lg bg-slate-900/20 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-400 font-bold">FAILED</span>
                          <span className="text-xs text-slate-400 font-mono">{attempt.metadata}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(attempt.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!loginData?.recentFailed || loginData.recentFailed.length === 0) && (
                <div className="mt-6 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 text-center">
                  <p className="text-sm text-emerald-400 font-semibold">No failed login attempts in this period.</p>
                  <p className="text-xs text-slate-500 mt-1">Your system is secure.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
