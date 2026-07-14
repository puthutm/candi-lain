"use client";

import AdminSidebar from "@/components/AdminSidebar";

export default function PermissionsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar activeTab="permissions" />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight">Permission Management</h1>
        <p className="mt-2 text-slate-400">
          Definisikan permission dan kaitkan dengan role
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold">Fitur sedang dikembangkan</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            Permission management akan segera tersedia untuk memberikan kontrol granular atas akses aplikasi
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
