"use server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

function sanitizeReturnTo(rawReturnTo: string | null): string {
  const fallback = "/home";
  if (!rawReturnTo) return fallback;

  const value = rawReturnTo.trim();
  if (!value) return fallback;

  // Relative path: allow only internal navigation
  if (value.startsWith("/")) {
    if (value.startsWith("//")) return fallback;
    return value;
  }

  // Absolute URL: only keep path/query/hash and reject localhost/container hosts
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;

    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "bce0a9b3b4ea"]);
    if (blockedHosts.has(hostname)) return fallback;

    const path = `${parsed.pathname || "/home"}${parsed.search}${parsed.hash}`;
    if (!path.startsWith("/")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

type LoginActionState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | null;

export async function loginAction(_prevState: LoginActionState, formData: FormData) {
  // Ensure database is seeded before attempting login
  await ensureDatabaseSeeded();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const returnTo = sanitizeReturnTo((formData.get("return_to") as string) || null);

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  const result = await AuthenticationService.authenticate(username, password);
  if (!result.success) {
    if (result.error === "INVALID_CREDENTIALS") {
      return { error: "Invalid username/email or password" };
    }
    if (result.error === "USER_INACTIVE") {
      return { error: "Your account is deactivated. Please contact support." };
    }
    if (result.error === "USER_LOCKED") {
      return { error: "Your account is locked due to too many failed attempts." };
    }
    return { error: "Authentication failed" };
  }

  // Create session
  const session = await AuthenticationService.createSession(result.user.id);
  
  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("sso_session", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400,
  });

  return { success: true, redirectTo: returnTo };
}
