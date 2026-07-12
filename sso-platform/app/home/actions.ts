"use server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sso_session")?.value;
  if (sessionId) {
    await AuthenticationService.destroySession(sessionId);
    cookieStore.delete("sso_session");
  }
  redirect("/");
}
