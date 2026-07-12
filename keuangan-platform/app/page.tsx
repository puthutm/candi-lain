"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.success && data.authenticated && data.user) {
          const target = data.user.role === "mahasiswa" ? "/skeum" : "/skeu";
          router.push(target);
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      }
    }
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Sesi Keuangan...</p>
      </div>
    </div>
  );
}
