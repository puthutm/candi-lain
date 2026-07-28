"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

export default function DosenLmsHeader() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <AppSwitcher />
        <span className="h-5 w-px bg-slate-200"></span>
        <span className="text-xs font-bold text-slate-700">
          Learning Management System (LMS) Dosen
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
        <span className="font-bold text-slate-800">Dr. Aulia Rahman, M.Kom.</span>
        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
          AR
        </span>
      </div>
    </header>
  );
}
