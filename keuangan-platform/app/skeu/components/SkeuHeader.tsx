"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

interface SkeuHeaderProps {
  adminUser: { name: string; username: string; role: string } | null;
  setShowClearanceModal: (show: boolean) => void;
}

export default function SkeuHeader({
  adminUser,
  setShowClearanceModal,
}: SkeuHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <AppSwitcher />
        <span className="h-5 w-px bg-slate-200"></span>
        <button
          onClick={() => setShowClearanceModal(true)}
          className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          🔍 Quick Clearance Check (NIM)
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
        <div className="text-right">
          <span className="font-bold text-slate-800 block">{adminUser?.name || "Staff Keuangan"}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {adminUser?.role === "admin" ? "Financial Controller" : "Keuangan BAAK"}
          </span>
        </div>
        <span className="w-9 h-9 rounded-full bg-[#FED524] text-[#0f487b] flex items-center justify-center font-bold text-sm shadow-xs">
          FK
        </span>
      </div>
    </header>
  );
}
