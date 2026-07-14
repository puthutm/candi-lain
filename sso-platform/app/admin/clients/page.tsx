"use client";

import AdminSidebar from "@/components/AdminSidebar";

export default function ClientsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar activeTab="clients" />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight">OAuth2 Clients Management</h1>
        <p className="mt-2 text-slate-400">
          Kelola client credentials dan configure grant types
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="text-4xl mb-4">🔑</div>
          <h3 className="text-lg font-semibold">Fitur sedang dikembangkan</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            OAuth2 client management akan segera tersedia untuk mengelola integrasi aplikasi pihak ketiga
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
