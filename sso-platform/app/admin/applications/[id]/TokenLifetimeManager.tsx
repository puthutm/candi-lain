"use client";

import { useState } from "react";

interface TokenLifetimeManagerProps {
  appId: string;
  currentAccessTokenLifetime: number | null;
  currentRefreshTokenLifetime: number | null;
}

export default function TokenLifetimeManager({
  appId,
  currentAccessTokenLifetime,
  currentRefreshTokenLifetime,
}: TokenLifetimeManagerProps) {
  const [accessTokenLifetime, setAccessTokenLifetime] = useState<number>(
    currentAccessTokenLifetime || 3600
  );
  const [refreshTokenLifetime, setRefreshTokenLifetime] = useState<number>(
    currentRefreshTokenLifetime || 86400
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessTokenLifetime,
          refreshTokenLifetime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Token lifetimes updated successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update token lifetimes" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
      <h2 className="text-base font-bold">Token Lifetime Configuration</h2>
      <p className="mt-1 text-xs text-slate-400">
        Override default token expiration times for this application. Leave as default (0) to use system defaults.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Access Token Lifetime (seconds)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={300}
              max={86400}
              value={accessTokenLifetime}
              onChange={(e) => setAccessTokenLifetime(parseInt(e.target.value) || 3600)}
              className="w-32 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              = {formatTime(accessTokenLifetime)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Default: 3600 (1 hour). Min: 300 (5 min), Max: 86400 (24 hours).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Refresh Token Lifetime (seconds)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={3600}
              max={2592000}
              value={refreshTokenLifetime}
              onChange={(e) => setRefreshTokenLifetime(parseInt(e.target.value) || 86400)}
              className="w-32 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              = {formatTime(refreshTokenLifetime)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Default: 86400 (1 day). Min: 3600 (1 hour), Max: 2592000 (30 days).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Token Lifetimes"}
        </button>

        {message && (
          <div
            className={`rounded-lg p-3 text-xs ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
