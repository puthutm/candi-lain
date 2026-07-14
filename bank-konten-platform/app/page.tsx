"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "./context/RoleContext";

export default function HomePage() {
  const { user, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memeriksa Sesi Otorisasi...</p>
      </div>
    </div>
  );
}
