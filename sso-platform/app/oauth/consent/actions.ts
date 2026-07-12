"use server";
import { getSessionUser } from "@/lib/auth-helper";
import { ConsentService } from "@/lib/services/consent";
import { ClientService } from "@/lib/services/client";
import { parseScopes } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function processConsentAction(formData: FormData) {
  const returnTo = formData.get("return_to") as string;
  const action = formData.get("action") as "allow" | "deny";

  if (!returnTo) {
    throw new Error("Missing return_to context");
  }

  // Parse parameters from return_to authorize URL
  const authorizeUrl = new URL(returnTo);
  const clientId = authorizeUrl.searchParams.get("client_id");
  const scope = authorizeUrl.searchParams.get("scope") || "";
  const state = authorizeUrl.searchParams.get("state") || "";
  const redirectUri = authorizeUrl.searchParams.get("redirect_uri");

  if (!clientId || !redirectUri) {
    throw new Error("Invalid authorize URL params in return_to");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/?return_to=${encodeURIComponent(returnTo)}`);
  }

  const app = await ClientService.getApplicationByClientId(clientId);
  if (!app) {
    throw new Error("Application not found");
  }

  if (action === "allow") {
    const scopes = parseScopes(scope);
    await ConsentService.grantConsent(user.id, app.id, scopes);
    
    // Redirect back to authorize endpoint, which will now automatically proceed
    redirect(returnTo);
  } else {
    // Redirect back to client callback with access_denied error
    const clientRedirectUrl = new URL(redirectUri);
    clientRedirectUrl.searchParams.set("error", "access_denied");
    clientRedirectUrl.searchParams.set("error_description", "The user denied the consent request");
    if (state) {
      clientRedirectUrl.searchParams.set("state", state);
    }
    
    redirect(clientRedirectUrl.toString());
  }
}
