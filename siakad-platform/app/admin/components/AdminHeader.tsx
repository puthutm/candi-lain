"use client";

interface AdminHeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  adminUser: { name: string; username: string; role: string } | null;
  currentYear: number;
}

export default function AdminHeader({
  setIsSidebarOpen,
  adminUser,
  currentYear,
}: AdminHeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-slate-500 hover:text-[#0f487b] transition-colors p-2 -ml-2 rounded-lg lg:hidden"
        >
          ☰
        </button>
        <div className="flex flex-col border-l border-slate-200 pl-4">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Portal Admin Akademik
          </h2>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
            Semester Ganjil {currentYear}/{currentYear + 1}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-bold">
          {adminUser?.name || "Admin"}
        </span>
        <span className="h-8 w-px bg-slate-200"></span>
        <span className="text-slate-400 cursor-pointer">🔔</span>
      </div>
    </header>
  );
}
