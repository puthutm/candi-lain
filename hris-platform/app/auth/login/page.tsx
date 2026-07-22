"use client";

import { useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function AuthLoginPageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const started = useRef(false);

  useEffect(() => {
    if (error) return;
    if (started.current) return;
    started.current = true;

    signIn("unsia-sso");
  }, [error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h1 className="text-lg font-bold text-white">Gagal Autentikasi SSO</h1>
          <p className="text-xs text-slate-400">
            Terjadi kesalahan konfigurasi autentikasi ({error}). Silakan coba login kembali atau hubungi administrator.
          </p>
          <button
            onClick={() => {
              window.location.href = "/auth/login";
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg transition-all"
          >
            Coba Login Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Mengarahkan ke SSO...
        </p>
      </div>
    </div>
  );
}

export default function HrisAuthLoginPage() {
  return (
    <Suspense fallback={<p className="text-white text-center p-8">Loading...</p>}>
      <AuthLoginPageContent />
    </Suspense>
  );
}
