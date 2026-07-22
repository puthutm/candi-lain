"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

export default function BankKontenAuthLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    signIn("unsia-sso");
  }, []);

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
