"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

interface ApplicantHeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  candidateName: string;
}

export default function ApplicantHeader({
  setIsSidebarOpen,
  candidateName,
}: ApplicantHeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-slate-500 hover:text-[#0f487b] transition-colors p-2 -ml-2 rounded-lg lg:hidden"
        >
          ☰
        </button>
        <AppSwitcher />
        <span className="h-5 w-px bg-slate-200"></span>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            PMB Portal Calon Mahasiswa Baru
          </h2>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
            Universitas Siber Asia
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-bold">{candidateName || "Budi Santoso"}</span>
      </div>
    </header>
  );
}
