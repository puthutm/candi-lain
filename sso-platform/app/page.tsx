"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions";
import Link from "next/link";

function LoginContent() {
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

    if (redirectTo.startsWith("http://") || redirectTo.startsWith("https://")) {
      window.location.href = redirectTo;
    } else {
      router.push(redirectTo);
    }
  }, [state, router]);

  const legacyState = state as { error?: string } | null;
  const nextState = state as { status?: "error" | "success" | "idle"; message?: string } | null;
  const errorMessage = legacyState?.error || (nextState?.status === "error" ? nextState.message : undefined);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200/80 px-8 py-3.5 shadow-sm z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center">
          {/* Logo UNSIA */}
          <div className="flex items-center gap-2.5">
            <svg className="h-10 w-[240px]" viewBox="0 0 240 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Shield logo */}
              <g transform="translate(0, 2)">
                <path d="M22 0 C10 0 3 7 3 16 C3 28 22 40 22 40 C22 40 41 28 41 16 C41 7 34 0 22 0 Z" fill="#0B4A75" />
                <path d="M10 12 C14 8 18 8 22 12 C26 8 30 8 34 12 C30 16 26 16 22 12 C18 16 14 16 10 12 Z" fill="#FED524" />
                <path d="M10 19 C14 15 18 15 22 19 C26 15 30 15 34 19 C30 23 26 23 22 19 C18 23 14 23 10 19 Z" fill="#FED524" />
                <path d="M14 26 C17 23 20 23 22 26 C24 23 27 23 29 26 C27 29 24 29 22 26 C20 29 17 29 14 26 Z" fill="#FED524" />
              </g>
              {/* Typography */}
              <text x="52" y="20" fill="#0B4A75" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.3">Universitas</text>
              <text x="52" y="37" fill="#0B4A75" fontSize="17" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.3">Siber Asia</text>
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Descriptive Intro */}
        <section className="lg:col-span-7 flex flex-col gap-6 text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0B4A75] leading-tight tracking-tight">
            Perkenalkan Wajah Baru<br />
            Sistem Informasi Akademik<br />
            UNSIA
          </h1>
          <h2 className="text-[#0B4A75] text-lg font-bold tracking-wide">
            Integrated Cyber Education Management System (ICEMS)
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl">
            Hadir dengan desain modern dan fitur canggih untuk pengalaman akademik yang lebih efisien dan terintegrasi. Akses data akademik, pendaftaran, jadwal kuliah, dan pemantauan progres belajar kini lebih mudah dalam satu platform digital yang responsif and user-friendly!
          </p>
        </section>

        {/* Right Column: Login Card */}
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
                    {/* User icon */}
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
                    {/* Lock icon */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path>
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0B4A75]/50 focus:bg-white focus:ring-1 focus:ring-[#0B4A75]/10"
                  />
                  {/* Eye icon to toggle show password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="remember_me"
                      value="true"
                      className="w-4 h-4 rounded border-slate-300 text-[#0B4A75] focus:ring-[#0B4A75]/20 cursor-pointer"
                    />
                    <span>Ingat Saya di Perangkat Ini</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-bold text-[#0B4A75] hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-center text-xs font-semibold text-red-600 p-3.5">
                  {errorMessage}
                </div>
              )}

              {/* Masuk Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-[#0B4A75] py-3 text-sm font-bold text-white transition hover:bg-[#0B4A75]/95 shadow-md shadow-[#0B4A75]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="flex items-center my-5 text-xs text-slate-400 before:content-[''] before:flex-1 before:border-b before:border-slate-100 before:mr-3 after:content-[''] after:flex-1 after:border-b after:border-slate-100 after:ml-3">
              atau
            </div>

            {/* Third-party Social Login Buttons */}
            <div className="space-y-2.5">
              <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                {/* Google Icon */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Masuk dengan Google
              </button>

              <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                {/* Microsoft Icon */}
                <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h11v11H0z" fill="#F25022" />
                  <path d="M12 0h11v11H12z" fill="#7FBA00" />
                  <path d="M0 12h11v11H0z" fill="#00A4EF" />
                  <path d="M12 12h11v11H12z" fill="#FFB900" />
                </svg>
                Masuk dengan Microsoft
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Area */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/50 bg-white shrink-0 mt-8">
        &copy; {new Date().getFullYear()} Universitas Siber Asia. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
