import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { refCategories, refItems, organizations } from "@/db/schema/reference";
import { sql } from "drizzle-orm";
import Link from "next/link";

export default async function ReferenceDashboardPage() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    const ssoAppUrl = process.env.NEXT_PUBLIC_SSO_APP_URL || "http://localhost:3000/";
    redirect(ssoAppUrl);
  }

  // Fetch categories with counts
  const categories = await db
    .select({
      id: refCategories.id,
      code: refCategories.code,
      name: refCategories.name,
      description: refCategories.description,
      itemCount: sql<number>`(select count(*) from ${refItems} where ${refItems.categoryId} = ${refCategories.id} and ${refItems.isActive} = true)`,
    })
    .from(refCategories);

  // Fetch organizations list
  const orgList = await db.select().from(organizations);

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Ref Data Console
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="text-xs text-slate-500">
          Super Admin: {user.fullName}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full space-y-12">
        {/* Categories Section */}
        <section>
          <header className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Master Data Categories</h1>
              <p className="text-slate-400 text-sm mt-1">Standalone console to manage global reference items across ERP.</p>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No master data categories registered.</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between shadow-md hover:border-white/20 transition-all"
                >
                  <div>
                    <span className="rounded bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 font-mono">
                      {cat.code}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-3">{cat.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {cat.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{cat.itemCount} active items</span>
                    <Link
                      href={`/categories/${cat.code}`}
                      className="font-bold text-emerald-400 hover:underline"
                    >
                      View Tree &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Organizations Section */}
        <section>
          <header className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Organizational Structure</h2>
              <p className="text-slate-400 text-sm mt-1">Corporate units division mapping registry.</p>
            </div>
          </header>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {orgList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No organization units mapped yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4">Unit Code</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {orgList.map((org) => (
                    <tr key={org.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-400">{org.code}</td>
                      <td className="p-4 font-semibold text-white">{org.name}</td>
                      <td className="p-4 font-mono text-xs uppercase text-slate-400">{org.type}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            org.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {org.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
