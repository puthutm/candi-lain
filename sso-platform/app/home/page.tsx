import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { userApplicationRoles } from "@/db/schema/rbac";
import { applications } from "@/db/schema/applications";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { logoutAction } from "./actions";
import Link from "next/link";
import { PORTAL_NAME } from "@/lib/client-config";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?return_to=%2Fhome");
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const hostname = host.split(":")[0] || "localhost";

  // Fetch applications user has active roles in
  const userApps = await db
    .selectDistinct({
      id: applications.id,
      clientId: applications.clientId,
      name: applications.name,
      description: applications.description,
      logoUrl: applications.logoUrl,
      redirectUris: applications.redirectUris,
    })
    .from(userApplicationRoles)
    .innerJoin(applications, eq(userApplicationRoles.applicationId, applications.id))
    .where(
      and(
        eq(userApplicationRoles.userId, user.id),
        eq(userApplicationRoles.status, "active"),
        eq(applications.status, "active")
      )
    );

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isUserAdmin = isSuperAdmin(user);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 font-sans text-white">
      {/* Glow blobs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[120px]" />

      {/* Top Navbar */}
      <nav className="z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-8 py-4 backdrop-blur-md">
        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          {PORTAL_NAME}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <span className="text-sm text-slate-300 font-medium">{user.fullName}</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>

      {/* Layout: sidebar (icon only) + main */}
      <div className="z-10 flex flex-1">
        {/* Sidebar */}
        <aside className="w-[56px] shrink-0 border-r border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="flex h-full flex-col items-center gap-3 py-6 text-white">
            {isUserAdmin && (
              <>
                <Link
                  href="/admin"
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-white/[0.04]"
                  aria-label="Admin Dashboard"
                >
                  {/* dashboard icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white group-hover:text-indigo-300"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                </Link>
                
                <Link
                  href="/admin/settings"
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-white/[0.04]"
                  aria-label="SSO Settings"
                >
                  {/* gear icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white group-hover:text-indigo-300"
                    aria-hidden="true"
                  >
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                    <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 0 1-1.4 3.4h-.2a1.8 1.8 0 0 0-2 1.2 2 2 0 0 1-3.9 0 1.8 1.8 0 0 0-2-1.2h-.2a2 2 0 0 1-1.4-3.4l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H4.7a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1A2 2 0 0 1 7.4 2.5h.2a1.8 1.8 0 0 0 2-1.2 2 2 0 0 1 3.9 0 1.8 1.8 0 0 0 2 1.2h.2a2 2 0 0 1 1.4 3.4l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.1a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.1a1.8 1.8 0 0 0-1.6 1z" />
                  </svg>
                </Link>
              </>
            )}

            {/* Profile icon */}
            <Link
              href="/home/profile"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-white/[0.04]"
              aria-label="Profile"
            >
              {/* user icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white group-hover:text-indigo-300"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Settings icon */}
            <Link
              href="/home/settings"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-white/[0.04]"
              aria-label="Settings"
            >
              {/* sliders icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white group-hover:text-indigo-300"
                aria-hidden="true"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <circle cx="4" cy="17" r="3" />
                <circle cx="12" cy="9" r="3" />
                <circle cx="20" cy="14" r="3" />
              </svg>
            </Link>

            {/* logout icon (always visible, icon-only) */}
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                aria-label="Logout"
                className="group mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-white/[0.04]"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white group-hover:text-indigo-300"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-8 py-12 max-w-6xl w-full mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getGreeting()}, {user.fullName}!
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Select an application below to sign in automatically.
            </p>
          </div>

          <hr className="my-8 border-white/10" />

          {/* Applications Grid */}
          {userApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 text-lg font-bold">
                ℹ
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Applications Assigned</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
                Your account has not been assigned any active applications yet. Please contact your system administrator to assign roles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(
                await Promise.all(
                  userApps.map(async (app) => {
                    const defaultUri = app.redirectUris[0] || "";

                    let authUrl = "";
                    try {
                      const uriUrl = new URL(defaultUri);
                      if (uriUrl.hostname === "localhost" || uriUrl.hostname === "127.0.0.1") {
                        uriUrl.hostname = hostname;
                      }
                      uriUrl.pathname = "/auth/login-start";
                      uriUrl.search = "";
                      authUrl = uriUrl.toString();
                    } catch {
                      authUrl = "/";
                    }

                    return { app, authUrl };
                  })
                )
              ).map(({ app, authUrl }) => (
                <a
                  key={app.id}
                  href={authUrl}
                  className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-4">
                    {app.logoUrl ? (
                      <img
                        src={app.logoUrl}
                        alt={`${app.name} Logo`}
                        className="h-12 w-12 rounded-lg border border-white/10 p-1 bg-white/5 object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xl font-bold text-indigo-400">
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {app.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end text-xs font-semibold text-indigo-400 group-hover:underline">
                    Access Application &rarr;
                  </div>
                </a>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
