import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminAppsPage() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    redirect("/");
  }

  const list = await db.select().from(applications);

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      <AdminSidebar activeTab="applications" adminName={user.fullName} />

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications Registry</h1>
            <p className="text-slate-400 text-sm mt-1">Manage client OAuth2 integrations and redirection endpoints.</p>
          </div>
          <Link
            href="/admin/applications/new"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md active:scale-95"
          >
            + Register Application
          </Link>
        </header>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {list.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No applications registered yet. Click "+ Register Application" to start.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">App Name</th>
                  <th className="p-4">Client ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Redirect URIs</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {list.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-semibold text-white">{app.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{app.clientId}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          app.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {app.redirectUris.length} whitelisted URIs
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:underline"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
