import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/lib/env";

function randomString(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET() {
  const state = randomString(16);
  const codeVerifier = randomString(64);
  const nonce = randomString(16);

  const cookieStore = await cookies();
  const cookieOptions = { path: "/", sameSite: "lax", secure: false, httpOnly: true } as const;

  cookieStore.set("pmb.authjs.state", state, cookieOptions);
  cookieStore.set("pmb.authjs.pkce.code_verifier", codeVerifier, cookieOptions);
  cookieStore.set("pmb.authjs.nonce", nonce, cookieOptions);
  cookieStore.set("pmb.authjs.csrf-token", randomString(32), cookieOptions);
  cookieStore.set("pmb.authjs.callback-url", "/", cookieOptions);

  const authorizeUrl = new URL(env.SSO_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.SSO_OAUTH_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", env.SSO_OAUTH_CALLBACK_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);

  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  console.info("[pmb][auth][login-start] manual authorize redirect", {
    stateLength: state.length,
    codeVerifierLength: codeVerifier.length,
    nonceLength: nonce.length,
    authorizeUrl: authorizeUrl.toString(),
  });

  return NextResponse.redirect(authorizeUrl.toString());
}

export const dynamic = "force-dynamic";
