"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

interface HrisHeaderProps {
  adminUser: { name: string; username: string; role: string } | null;
}

export default function HrisHeader({ adminUser }: HrisHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <AppSwitcher />
        <span className="h-5 w-px bg-slate-200"></span>
        <span className="text-xs font-bold text-slate-700">
          Portal Kepegawaian & BKD Dosen ERP UNSIA
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
        <div className="text-right">
          <span className="font-bold text-slate-800 block">{adminUser?.name || "Admin SDM"}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {adminUser?.role === "admin" ? "HR Manager BAAK" : "Staff SDM"}
          </span>
        </div>
        <span className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm shadow-xs">
          HR
        </span>
      </div>
    </header>
  );
}
