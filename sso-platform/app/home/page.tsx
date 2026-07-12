import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { userApplicationRoles } from "@/db/schema/rbac";
import { applications } from "@/db/schema/applications";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";
import Link from "next/link";
import { headers } from "next/headers";

function getPublicBaseUrlFromHeaders(headerStore: Headers): string {
  const host = headerStore.get("host") || "localhost:3000";
  const proto = "http";
  return `${proto}://${host}`;
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    const headerStore = await headers();
    const baseUrl = getPublicBaseUrlFromHeaders(headerStore);
    const returnTo = `${baseUrl}/home`;
    redirect(`/?return_to=${encodeURIComponent(returnTo)}`);
  }

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
          SSO Portal
        </span>
        <div className="flex items-center gap-4">
          {isUserAdmin && (
            <Link
              href="/admin"
              className="rounded-lg bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-400 border border-indigo-500/30 transition-all hover:bg-indigo-500/30"
            >
              Admin Dashboard
            </Link>
          )}
          <span className="text-sm text-slate-400">{user.fullName}</span>
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

      {/* Main content */}
      <main className="z-10 flex-1 px-8 py-12 max-w-6xl mx-auto w-full">
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
            {userApps.map((app) => {
              // Construct a default authorization redirection flow link with mockup PKCE
              const defaultUri = app.redirectUris[0] || "http://localhost:3000";
              const authUrl = `/oauth/authorize?client_id=${app.clientId}&redirect_uri=${encodeURIComponent(
                defaultUri
              )}&response_type=code&scope=openid+profile&code_challenge=E9Melhoa2OwvFrGMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=sso_portal_direct`;

              return (
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
