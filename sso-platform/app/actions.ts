"use server";
import { cookies, headers } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { env } from "@/lib/env";

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

    const allowedHosts = (env.ALLOWED_RETURN_TO_HOSTS || "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (allowedHosts.length > 0 && !allowedHosts.includes(hostname)) return fallback;

    const path = `${parsed.pathname || "/home"}${parsed.search}${parsed.hash}`;
    if (!path.startsWith("/")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

type LoginActionState = {
  status?: "idle" | "error" | "success";
  code?:
    | "VALIDATION_ERROR"
    | "INVALID_CREDENTIALS"
    | "USER_INACTIVE"
    | "USER_LOCKED"
    | "AUTH_FAILED";
  message?: string;
  redirectTo?: string;
  fieldErrors?: {
    username?: string;
    password?: string;
  };
} | null;

function mapAuthErrorToState(error: string): LoginActionState {
  switch (error) {
    case "INVALID_CREDENTIALS":
      return { status: "error", code: "INVALID_CREDENTIALS", message: "Invalid username/email or password" };
    case "USER_INACTIVE":
      return { status: "error", code: "USER_INACTIVE", message: "Your account is deactivated. Please contact support." };
    case "USER_LOCKED":
      return { status: "error", code: "USER_LOCKED", message: "Your account is locked due to too many failed attempts." };
    default:
      return { status: "error", code: "AUTH_FAILED", message: "Authentication failed" };
  }
}

type LegacyLoginActionState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
} | null;

async function computeCookieSecureFromRequest(): Promise<boolean> {
  const reqHeaders = await headers();
  const xForwardedProto = (reqHeaders.get("x-forwarded-proto") || "").toLowerCase();
  const referer = reqHeaders.get("referer") || "";
  const origin = reqHeaders.get("origin") || "";

  return (
    xForwardedProto === "https" ||
    referer.startsWith("https://") ||
    origin.startsWith("https://")
  );
}

export async function loginAction(
  _prevState: any,
  formData: FormData
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const returnTo = sanitizeReturnTo((formData.get("return_to") as string) || null);

  if (!username || !password) {
    return {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Username and password are required",
      fieldErrors: {
        username: !username ? "Username is required" : undefined,
        password: !password ? "Password is required" : undefined,
      },
    };
  }

  try {
    const result = await AuthenticationService.authenticate(username, password);
    if (!result.success) return mapAuthErrorToState(result.error);

    const session = await AuthenticationService.createSession(result.user.id);

    const cookieSecure = await computeCookieSecureFromRequest();

    const cookieStore = await cookies();
    cookieStore.set("sso_session", session.id, {
      path: "/",
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: env.SESSION_MAX_AGE,
    });

    return {
      status: "success",
      success: true,
      redirectTo: returnTo,
    };
  } catch (err) {
    console.error("❌ loginAction failed", err);
    return {
      status: "error",
      code: "AUTH_FAILED",
      message: "Authentication failed",
    };
  }
}
