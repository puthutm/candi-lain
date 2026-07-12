"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [identity, setIdentity] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [demoLink, setDemoLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setDemoLink("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        if (data.resetLink) {
          setDemoLink(data.resetLink);
        }
      } else {
        setError(data.error || "Gagal mengirim link reset password.");
      }
    } catch (err: any) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg text-2xl mb-4">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Lupa Kata Sandi</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Masukkan Email terdaftar, NIP Dosen/Pegawai, atau NIM Mahasiswa untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {/* Notices */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl flex flex-col gap-2">
            <span>✓ {message}</span>
            {demoLink && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Demo Testing Reset Link:</span>
                <a 
                  href={demoLink} 
                  className="font-mono text-[10px] break-all text-indigo-400 underline hover:text-indigo-300"
                >
                  {demoLink}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Email, NIP, atau NIM</label>
            <input
              type="text"
              required
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="Masukkan identitas Anda..."
              className="px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </button>
        </form>

        <div className="text-center border-t border-slate-800 pt-4">
          <Link href="/login" className="text-xs font-bold text-indigo-400 hover:underline">
            &larr; Kembali ke Halaman Login
          </Link>
        </div>

      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
