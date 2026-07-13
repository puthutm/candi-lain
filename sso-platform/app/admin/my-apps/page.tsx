import { getSessionUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import { PORTAL_NAME } from "@/lib/client-config";
import Link from "next/link";

export default async function MyAppsDashboard() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  // Fetch applications owned by the user
  const list = await db
    .select()
    .from(applications)
    .where(eq(applications.ownerUserId, user.id));

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {PORTAL_NAME}
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/home"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              &larr; Back to Portal
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <header className="pb-6 border-b border-white/10">
          <h1 className="text-3xl font-bold tracking-tight">App Owner Console</h1>
          <p className="text-slate-400 text-sm mt-1">Manage roles and permissions for applications you own.</p>
        </header>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-dashed border-white/10 p-12 text-center text-slate-500 text-sm">
              You do not own any application registry configs. Please contact a Super Admin to assign ownership.
            </div>
          ) : (
            list.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{app.name}</h3>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {app.description || "No description provided."}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-3">Client ID: {app.clientId}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500">{app.redirectUris.length} callbacks</span>
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="font-bold text-indigo-400 hover:underline"
                  >
                    Manage Roles & Users &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
