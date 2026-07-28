"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

interface PmbHeaderProps {
  activeWaveName?: string;
}

export default function PmbHeader({ activeWaveName }: PmbHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <AppSwitcher currentApp="pmb" />
        <span className="h-5 w-px bg-slate-200"></span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Gelombang Aktif:</span>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
            ● {activeWaveName || "Gelombang 1 2026/2027"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
        <span>Admin PMB BAAK</span>
        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
          BA
        </span>
      </div>
    </header>
  );
}
