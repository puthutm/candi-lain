"use server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { ensureDatabaseSeeded } from "@/lib/seed";

export async function loginAction(_prevState: any, formData: FormData) {
  // Ensure database is seeded before attempting login
  await ensureDatabaseSeeded();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const returnTo = formData.get("return_to") as string || "/home";

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
