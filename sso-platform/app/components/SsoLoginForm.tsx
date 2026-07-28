"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions";
import Link from "next/link";

export default function SsoLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to") || "/home";

  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const legacyState = state as { success?: boolean; redirectTo?: string } | null;
    const nextState = state as { status?: "success" | "error" | "idle"; redirectTo?: string } | null;

    const redirectTo = nextState?.redirectTo || legacyState?.redirectTo;
    const isSuccess = Boolean(nextState?.status === "success" || legacyState?.success);

    if (!isSuccess || !redirectTo) return;
    window.location.href = redirectTo;
  }, [state, router]);

  const legacyState = state as { error?: string } | null;
  const nextState = state as { status?: "error" | "success" | "idle"; message?: string } | null;
  const errorMessage = legacyState?.error || (nextState?.status === "error" ? nextState.message : undefined);

  return (
    <section className="lg:col-span-5 flex justify-center lg:justify-end">
      <div className="w-full max-w-[420px] rounded-3xl bg-white border border-slate-200/60 p-8 shadow-xl shadow-slate-200/50">
        <h2 className="text-center text-xl font-extrabold text-[#0B4A75] mb-8">
          Masuk
        </h2>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="return_to" value={returnTo} />

          {/* Username field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="username">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="admin"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0B4A75]/50 focus:bg-white focus:ring-1 focus:ring-[#0B4A75]/10"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="password">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path>
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0B4A75]/50 focus:bg-white focus:ring-1 focus:ring-[#0B4A75]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Links & Submit */}
          <div className="flex items-center justify-between text-xs pt-1">
            <Link href="/forgot-password" className="text-[#0B4A75] font-bold hover:underline">
              Lupa Password?
            </Link>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-[#0B4A75] hover:bg-[#083656] text-white font-bold text-sm rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Masuk ke Sistem"}
          </button>
        </form>
      </div>
    </section>
  );
}
