"use client";

import { useEffect } from "react";
import { SSO_AUTHORIZE_URL, SSO_CLIENT_ID, SSO_CALLBACK_URL, INSTITUTION_SHORT_NAME } from "@/lib/client-config";

export default function LoginPage() {
  useEffect(() => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    sessionStorage.setItem("sso_code_verifier", verifier);
    const ssoUrl = `${SSO_AUTHORIZE_URL}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(SSO_CALLBACK_URL)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
    window.location.href = ssoUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mengarahkan ke SSO {INSTITUTION_SHORT_NAME}...</p>
      </div>
    </div>
  );
}
