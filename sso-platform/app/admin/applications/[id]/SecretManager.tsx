"use client";

import { useState } from "react";

interface SecretManagerProps {
  appId: string;
  clientId: string;
}

export default function SecretManager({ appId, clientId }: SecretManagerProps) {
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySecret = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Apakah Anda yakin ingin memperbarui Client Secret? Client secret yang lama tidak akan bisa digunakan lagi.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/secret`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.clientSecret) {
        setNewSecret(data.clientSecret);
      } else {
        alert(data.error || "Gagal memperbarui Client Secret");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client ID</span>
          <button
            onClick={handleCopyId}
            className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
          >
            {copiedId ? "✓ Tersalin!" : "📋 Salin ID"}
          </button>
        </div>
        <p className="font-mono text-slate-200 bg-slate-900/80 p-2.5 rounded-lg select-all border border-white/10 break-all font-semibold">
          {clientId}
        </p>
      </div>

      <div className="pt-2 border-t border-white/10">
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span>{loading ? "⌛ Regenerating..." : "🔄 Regenerate Client Secret"}</span>
        </button>
      </div>

      {newSecret && (
        <div className="mt-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              🔑 Client Secret Baru (Salin Sekarang!)
            </span>
            <button
              onClick={handleCopySecret}
              className="text-[10px] font-bold text-emerald-300 hover:underline"
            >
              {copiedSecret ? "✓ Tersalin!" : "📋 Salin Secret"}
            </button>
          </div>
          <p className="font-mono text-xs text-white bg-black/50 p-2 rounded border border-emerald-500/30 break-all select-all font-bold">
            {newSecret}
          </p>
          <p className="text-[10px] text-emerald-400/80 italic">
            Simpan secret ini ke .env aplikasi Anda. Secret ini tidak akan ditampilkan lagi demi keamanan.
          </p>
        </div>
      )}
    </div>
  );
}
