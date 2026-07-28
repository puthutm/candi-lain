"use client";

import { useState } from "react";

interface AppRoleItem {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  authUrl: string;
  roles: { id: string; roleKey: string; roleName: string }[];
}

export default function RoleSelectorModal({ apps }: { apps: AppRoleItem[] }) {
  const [selectedApp, setSelectedApp] = useState<AppRoleItem | null>(null);
  const [chosenRole, setChosenRole] = useState<string>("");

  const handleAppClick = (app: AppRoleItem, e: React.MouseEvent) => {
    if (app.roles && app.roles.length > 1) {
      e.preventDefault();
      setSelectedApp(app);
      setChosenRole(app.roles[0]?.roleKey || "");
    } else {
      // Direct navigate if single role or no role restriction
      window.location.href = app.authUrl;
    }
  };

  const handleConfirmRole = () => {
    if (!selectedApp) return;
    const targetUrl = new URL(selectedApp.authUrl, window.location.origin);
    targetUrl.searchParams.set("role", chosenRole);
    window.location.href = targetUrl.toString();
  };

  return (
    <>
      {/* App Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <a
            key={app.id}
            href={app.authUrl}
            onClick={(e) => handleAppClick(app, e)}
            className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-white/[0.06] cursor-pointer"
          >
            <div>
              <div className="flex items-start gap-4">
                {app.logoUrl ? (
                  <img
                    src={app.logoUrl}
                    alt={`${app.name} Logo`}
                    className="h-12 w-12 rounded-xl border border-white/10 p-1 bg-white/5 object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-md">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {app.description || "Aplikasi SSO Kampus Terpadu"}
                  </p>
                </div>
              </div>

              {/* Roles Badge List */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {app.roles.map((r) => (
                  <span
                    key={r.id}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  >
                    {r.roleName || r.roleKey}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-semibold text-indigo-400">
              <span>{app.roles.length > 1 ? "🎭 Pilih Peran Akses" : "Buka Aplikasi"}</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </a>
        ))}
      </div>

      {/* MODAL DIALOG ROLE SELECTION */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-lg font-bold">
                  🎭
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pilih Peran Masuk
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedApp.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Akun Anda memiliki <span className="text-indigo-400 font-bold">{selectedApp.roles.length} peran</span> untuk aplikasi ini. Silakan pilih peran yang ingin Anda gunakan:
            </p>

            {/* List of Roles */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {selectedApp.roles.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setChosenRole(r.roleKey)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    chosenRole === r.roleKey
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="role_choice"
                      value={r.roleKey}
                      checked={chosenRole === r.roleKey}
                      onChange={() => setChosenRole(r.roleKey)}
                      className="text-indigo-500 focus:ring-indigo-400"
                    />
                    <div>
                      <div className="text-xs font-bold capitalize">
                        {r.roleName || r.roleKey}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Key: {r.roleKey}
                      </div>
                    </div>
                  </div>
                  {chosenRole === r.roleKey && (
                    <span className="text-xs text-indigo-400 font-bold">✓ Selected</span>
                  )}
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRole}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Masuk Sebagai {chosenRole.toUpperCase()}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
