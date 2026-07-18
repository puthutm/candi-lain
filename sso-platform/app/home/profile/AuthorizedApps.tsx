"use client";

import { useEffect, useState } from "react";

interface Consent {
  id: string;
  scope: string;
  grantedAt: string;
  appId: string;
  appName: string;
  appDescription: string | null;
  appLogo: string | null;
  clientId: string;
}

export default function AuthorizedApps() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchConsents = async () => {
    try {
      const res = await fetch("/api/profile/consents");
      const data = await res.json();
      if (data.success) {
        setConsents(data.consents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (consentId: string, appName: string) => {
    if (!confirm(`Apakah Anda yakin ingin mencabut izin akses untuk aplikasi "${appName}"?`)) {
      return;
    }

    try {
      setNotice(`Mencabut akses untuk ${appName}...`);
      const res = await fetch(`/api/profile/consents?consentId=${consentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConsents(consents.filter(c => c.id !== consentId));
        setNotice(`Akses untuk ${appName} berhasil dicabut.`);
      } else {
        setNotice(`Gagal mencabut akses: ${data.error}`);
      }
    } catch (err) {
      setNotice("Kesalahan jaringan saat mencabut akses.");
    } finally {
      setTimeout(() => setNotice(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
        Memuat aplikasi terotorisasi...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-t border-white/10 pt-8">
        <h2 className="text-xl font-bold tracking-tight">Aplikasi Terotorisasi</h2>
        <p className="mt-1 text-xs text-slate-400">
          Aplikasi di bawah ini memiliki akses ke akun SSO Anda. Anda dapat mencabut akses kapan saja.
        </p>
      </div>

      {notice && (
        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300 font-semibold">
          {notice}
        </div>
      )}

      {consents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs text-slate-500">
          Tidak ada aplikasi eksternal yang saat ini memiliki akses ke akun Anda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition p-5 flex items-start gap-4"
            >
              {consent.appLogo ? (
                <img
                  src={consent.appLogo}
                  alt={`${consent.appName} Logo`}
                  className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 p-1 object-contain shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-lg font-bold flex items-center justify-center shrink-0">
                  {consent.appName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h3 className="text-sm font-bold truncate text-white">{consent.appName}</h3>
                  <span className="text-[10px] text-slate-500 font-mono block truncate">Client ID: {consent.clientId}</span>
                </div>
                {consent.appDescription && (
                  <p className="text-xs text-slate-400 line-clamp-2">{consent.appDescription}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {consent.scope.split(" ").map((s) => (
                    <span
                      key={s}
                      className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Diberikan: {new Date(consent.grantedAt).toLocaleDateString("id-ID")}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleRevoke(consent.id, consent.appName)}
                    className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 text-[10px] font-bold rounded-lg transition-all"
                  >
                    Cabut Akses
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
