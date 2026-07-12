import { getSessionUser } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { parseScopes } from "@/lib/utils";
import { redirect } from "next/navigation";
import { processConsentAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ return_to?: string }>;
}

export default async function ConsentPage({ searchParams }: PageProps) {
  const { return_to: returnTo } = await searchParams;

  if (!returnTo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400">Invalid Request</h2>
          <p className="mt-2 text-sm text-slate-400">Missing authorization return context.</p>
        </div>
      </div>
    );
  }

  // Parse parameters from returnTo URL
  let clientId = "";
  let scopeString = "";
  try {
    const authorizeUrl = new URL(returnTo);
    clientId = authorizeUrl.searchParams.get("client_id") || "";
    scopeString = authorizeUrl.searchParams.get("scope") || "";
  } catch (err) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400">Invalid Context</h2>
          <p className="mt-2 text-sm text-slate-400">Could not parse return context URL.</p>
        </div>
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/?return_to=${encodeURIComponent(returnTo)}`);
  }

  const app = await ClientService.getApplicationByClientId(clientId);
  if (!app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400">Application Not Found</h2>
          <p className="mt-2 text-sm text-slate-400">The application requesting access does not exist.</p>
        </div>
      </div>
    );
  }

  const scopes = parseScopes(scopeString);

  // Scope user-friendly descriptions
  const getScopeDescription = (scopeCode: string) => {
    switch (scopeCode) {
      case "openid":
        return "Verify your identity and unique user identifier.";
      case "profile":
        return "Access your profile information (Full Name, Username).";
      case "email":
        return "Access your corporate email address.";
      default:
        return `Custom application permission: "${scopeCode}".`;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 font-sans text-white">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          {app.logoUrl ? (
            <img
              src={app.logoUrl}
              alt={`${app.name} Logo`}
              className="mx-auto h-16 w-16 rounded-xl border border-white/10 p-2 object-contain bg-white/5"
            />
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-indigo-500/20 text-2xl font-bold text-indigo-400">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            {app.name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            is requesting permission to access your SSO account
          </p>
        </div>

        <hr className="my-6 border-white/10" />

        {/* Display Scopes */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            This application wants to:
          </p>
          <div className="space-y-3">
            {scopes.length === 0 ? (
              <div className="flex gap-3 rounded-lg bg-white/5 p-3 text-sm text-slate-300">
                <span>Default basic read access permissions only.</span>
              </div>
            ) : (
              scopes.map((s) => (
                <div key={s} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white uppercase tracking-wide">{s}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{getScopeDescription(s)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Logged in as <span className="font-semibold text-slate-300">{user.email}</span>
        </p>

        {/* Form submitting to actions */}
        <div className="mt-6 flex gap-4">
          <form action={processConsentAction} className="flex-1">
            <input type="hidden" name="return_to" value={returnTo} />
            <input type="hidden" name="action" value="deny" />
            <button
              type="submit"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Deny Access
            </button>
          </form>

          <form action={processConsentAction} className="flex-1">
            <input type="hidden" name="return_to" value={returnTo} />
            <input type="hidden" name="action" value="allow" />
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Allow Access
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
