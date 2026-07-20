import { signIn } from "@/auth";

export async function GET() {
  // Use Auth.js official signIn so state/PKCE/nonce cookies are set with
  // the correct format (base64url-encoded JSON) that the callback handler expects.
  // This avoids "InvalidCheck: state value could not be parsed" errors.
  //
  // IMPORTANT: Do NOT use { redirect: false } when calling signIn() from a route
  // handler, because server-side signIn() with redirect:false may not flush
  // cookies (state, pkce.code_verifier, nonce) into the response.  Let signIn()
  // return its own Response object so all cookies are properly attached.
  const response = await signIn("unsia-sso", { redirect: true });
  return response;
}

export const dynamic = "force-dynamic";
