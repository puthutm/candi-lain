"use client";

import { useEffect, useState } from "react";

interface ConsentHistoryItem {
  consentId: string;
  applicationId: string;
  applicationName: string;
  applicationLogo: string | null;
  scopes: string[];
  grantedAt: string;
  revokedAt: string | null;
}

export default function ConsentHistory() {
  const [history, setHistory] = useState<ConsentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/profile/consents/history");
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
        Memuat riwayat consent...
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-white/10 pt-8">
        <h2 className="text-xl font-bold tracking-tight">Riwayat Consent</h2>
        <p className="mt-1 text-xs text-slate-400">
          Riwayat pemberian dan pencabutan izin akses aplikasi ke akun SSO Anda.
        </p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition"
      >
        <span>{expanded ? "\u25B2" : "\u25BC"}</span>
        <span>{expanded ? "Sembunyikan riwayat" : `Tampilkan riwayat (${history.length})`}</span>
      </button>

      {expanded && (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.consentId}
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                item.revokedAt
                  ? "border-rose-500/10 bg-rose-500/[0.02]"
                  : "border-emerald-500/10 bg-emerald-500/[0.02]"
              }`}
            >
              {item.applicationLogo ? (
                <img
                  src={item.applicationLogo}
                  alt={item.applicationName}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 p-0.5 object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">
                  {item.applicationName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.applicationName}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.revokedAt
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {item.revokedAt ? "Dicabut" : "Aktif"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {item.scopes.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                  <div>Diberikan: {new Date(item.grantedAt).toLocaleString("id-ID")}</div>
                  {item.revokedAt && (
                    <div className="text-rose-400/70">
                      Dicabut: {new Date(item.revokedAt).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
