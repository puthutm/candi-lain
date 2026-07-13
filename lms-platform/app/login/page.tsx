"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../context/RoleContext";
import { INSTITUTION_NAME, INSTITUTION_SHORT_NAME } from "@/lib/client-config";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshSession } = useRole();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSession();
        router.push("/");
      } else {
        setErrorMsg(data.error || "Gagal masuk.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#004996]/20 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FED524]/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* Logo and title */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-lg shadow-[#004996]/20 relative">
            <span className="text-white font-display font-black text-2xl">U</span>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FED524] border-2 border-slate-900"></div>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white tracking-tight">Portal SSO {INSTITUTION_SHORT_NAME}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Single Sign-On Identity Provider</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold p-3.5 rounded-xl text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username SSO</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 bg-slate-850 border border-slate-800 focus:border-[#004996] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996]/20 text-xs font-semibold text-white"
              placeholder="e.g. hendrasetiawan"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password SSO</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 bg-slate-850 border border-slate-800 focus:border-[#004996] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996]/20 text-xs font-semibold text-white"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#004996] hover:bg-[#004996]/95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#004996]/15 transition duration-150 cursor-pointer text-center"
          >
            {loading ? "Menghubungkan SSO..." : "Masuk dengan Akun SSO"}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
            {INSTITUTION_NAME} · Be Smart, Be Cyber
          </p>
        </div>

      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
