"use server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";

export async function registerAppAction(prevState: any, formData: FormData) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return { error: "Unauthorized access" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const redirectUrisRaw = formData.get("redirectUris") as string;
  const logoUrl = formData.get("logoUrl") as string;

  if (!name || !redirectUrisRaw) {
    return { error: "Application Name and Redirect URIs are required" };
  }

  // Parse redirect URIs (one per line or comma-separated)
  const redirectUris = redirectUrisRaw
    .split(/[\n,]/)
    .map((uri) => uri.trim())
    .filter(Boolean);

  if (redirectUris.length === 0) {
    return { error: "At least one valid redirect URI is required" };
  }

  try {
    const { application, rawSecret } = await ClientService.createApplication({
      name,
      description,
      redirectUris,
      logoUrl,
      ownerUserId: user.id,
    });

    return {
      success: true,
      name: application.name,
      clientId: application.clientId,
      clientSecret: rawSecret,
      redirectUris: application.redirectUris,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to register application" };
  }
}
