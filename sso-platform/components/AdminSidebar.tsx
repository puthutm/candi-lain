"use client";

import Link from "next/link";

interface AdminSidebarProps {
  activeTab: "dashboard" | "applications" | "reference" | "settings" | "profile" | "users" | "roles" | "permissions" | "clients" | "audit-logs";
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
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>📊</span> Dashboard
          </Link>
          <Link
            href="/admin/applications"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "applications"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>📦</span> Applications
          </Link>
          <Link
            href="/admin/reference"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "reference"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>📚</span> Reference Data
          </Link>
          <Link
            href="/admin/settings"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>⚙️</span> SSO Settings
          </Link>
          <hr className="border-white/10 my-2" />
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 py-2">Manajemen</div>
          <Link
            href="/admin/users"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>👥</span> Kelola User
          </Link>
          <Link
            href="/admin/roles"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "roles"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>🎭</span> Kelola Role
          </Link>
          <Link
            href="/admin/permissions"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "permissions"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>🔐</span> Permissions
          </Link>
          <Link
            href="/admin/clients"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "clients"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>🔑</span> OAuth2 Clients
          </Link>
          <Link
            href="/admin/audit-logs"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "audit-logs"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>📋</span> Audit Logs
          </Link>
          <hr className="border-white/10 my-2" />
          <Link
            href="/admin/profile"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>👤</span> Admin Profile
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
