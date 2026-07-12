"use client";

import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const ssoUrl = "http://localhost:3000/oauth/authorize?client_id=keuangan-platform&redirect_uri=http://localhost:3005/api/auth/callback&response_type=code&code_challenge=mock_challenge&code_challenge_method=plain&scope=openid";
    window.location.href = ssoUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mengarahkan ke SSO UNSIA...</p>
      </div>
    </div>
  );
}
