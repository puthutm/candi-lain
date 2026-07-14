"use client";

import Link from "next/link";

interface AdminSidebarProps {
  activeTab: "dashboard" | "applications" | "reference" | "settings" | "profile";
  adminName?: string;
}

export default function AdminSidebar({ activeTab, adminName }: AdminSidebarProps) {
  return (
    <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent flex items-center gap-2">
          <span>🛡️</span>
          <span>SSO Admin</span>
        </div>
        <nav className="flex flex-col gap-2">
          <Link
            href="/admin"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/applications"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "applications"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Applications
          </Link>
          <Link
            href="/admin/reference"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "reference"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Reference Data
          </Link>
          <Link
            href="/admin/settings"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            SSO Settings
          </Link>
          <Link
            href="/admin/profile"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Admin Profile
          </Link>
          <hr className="border-white/10 my-2" />
          <Link
            href="/home"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all border border-transparent border-dashed flex items-center gap-1"
          >
            <span>&larr;</span> User Portal
          </Link>
        </nav>
      </div>
      {adminName && (
        <div className="text-xs text-slate-500 pt-4 border-t border-white/5 truncate">
          Logged in as: <span className="font-semibold text-slate-400">{adminName}</span>
        </div>
      )}
    </aside>
  );
}
