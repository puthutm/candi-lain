"use client";

import AppSwitcher from "@/app/components/AppSwitcher";

interface StudentLmsHeaderProps {
  studentName: string;
  studentUserId: string;
}

export default function StudentLmsHeader({
  studentName,
  studentUserId,
}: StudentLmsHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <AppSwitcher />
        <span className="h-5 w-px bg-slate-200"></span>
        <span className="text-xs font-bold text-slate-700">
          Learning Management System (LMS) Mahasiswa
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
        <div className="text-right">
          <span className="font-bold text-slate-800 block">{studentName}</span>
          <span className="text-[10px] text-slate-400 font-mono">NIM: {studentUserId}</span>
        </div>
        <span className="w-9 h-9 rounded-full bg-[#FED524] text-[#0f487b] flex items-center justify-center font-bold text-sm shadow-xs">
          {studentName.slice(0, 2).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
