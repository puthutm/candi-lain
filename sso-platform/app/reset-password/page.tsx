"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Kata sandi konfirmasi tidak cocok.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Gagal memperbarui kata sandi.");
      }
    } catch (err: any) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl mb-4">
          ⚠️ Token reset password tidak ditemukan di URL.
        </div>
        <Link href="/forgot-password" className="text-xs font-bold text-indigo-400 hover:underline">
          Kirim ulang tautan reset password
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg text-2xl mb-4">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Atur Ulang Sandi</h1>
        <p className="text-xs text-slate-400 mt-2">
          Masukkan kata sandi baru Anda di bawah ini untuk memperbarui akun.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl">
          ✓ {message}
          <div className="mt-3">
            <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-500 transition inline-block">
              Masuk Sekarang
            </Link>
          </div>
        </div>
      )}

      {!message && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Kata Sandi Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter..."
              className="px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru..."
              className="px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition active:scale-95 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Perbarui Kata Sandi"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <Suspense fallback={
          <div className="text-center text-slate-400 text-xs">Memuat Form...</div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
