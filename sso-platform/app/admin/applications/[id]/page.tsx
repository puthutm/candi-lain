import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { RBACService } from "@/lib/services/rbac";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userApplicationRoles, applicationRoles } from "@/db/schema/rbac";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import AdminSidebar from "@/components/AdminSidebar";
import AppActions from "./AppActions";
import RolesManager from "./RolesManager";
import AssignmentsManager from "./AssignmentsManager";
import SecretManager from "./SecretManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }

  const app = await ClientService.getApplicationById(id);
  if (!app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400">Not Found</h2>
          <p className="mt-2 text-slate-400 text-sm">Application not found.</p>
        </div>
      </div>
    );
  }

  const userIsAdmin = isSuperAdmin(user);
  const userIsOwner = app.ownerUserId === user.id;

  if (!userIsAdmin && !userIsOwner) {
    redirect("/home");
  }

  // Fetch application roles
  const roles = await RBACService.getRolesByApplication(id);

  // Fetch active user assignments with details
  const assignments = await db
    .select({
      id: userApplicationRoles.id,
      userId: userApplicationRoles.userId,
      fullName: users.fullName,
      email: users.email,
      roleId: userApplicationRoles.roleId,
      roleName: applicationRoles.roleName,
      grantedAt: userApplicationRoles.grantedAt,
    })
    .from(userApplicationRoles)
    .innerJoin(users, eq(userApplicationRoles.userId, users.id))
    .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
    .where(
      and(
        eq(userApplicationRoles.applicationId, id),
        eq(userApplicationRoles.status, "active")
      )
    );

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      {/* Sidebar */}
      <AdminSidebar activeTab="applications" adminName={user.fullName} />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* App details header */}
        <header className="flex items-center gap-6 pb-8 border-b border-white/10">
          {app.logoUrl ? (
            <img
              src={app.logoUrl}
              alt={`${app.name} Logo`}
              className="h-16 w-16 rounded-xl border border-white/10 bg-white/5 p-2 object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl font-bold text-indigo-400 border border-indigo-500/20">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                {app.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{app.description || "No description provided."}</p>
            <div className="mt-4">
              <AppActions app={app} />
            </div>
          </div>
        </header>

        {/* Configurations details */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md space-y-4">
              <h2 className="text-base font-bold">Integration Credentials</h2>
              <SecretManager appId={id} clientId={app.clientId} />
              <div className="pt-3 border-t border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Allowed Grant Types</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {app.allowedGrantTypes.map((type) => (
                    <span key={type} className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-white/5">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
              <h2 className="text-base font-bold">Redirect URIs</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                {app.redirectUris.map((uri) => (
                  <li key={uri} className="font-mono truncate bg-slate-900/40 p-2 rounded border border-white/5">
                    {uri}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Roles configuration card */}
            <RolesManager appId={id} initialRoles={roles} />

            {/* Active User assignments card */}
            <AssignmentsManager appId={id} initialAssignments={assignments.map(a => ({
              id: a.id,
              userId: a.userId,
              fullName: a.fullName,
              email: a.email,
              roleId: a.roleId,
              roleName: a.roleName,
              grantedAt: a.grantedAt.toISOString(),
            }))} roles={roles} />
          </div>
        </section>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
