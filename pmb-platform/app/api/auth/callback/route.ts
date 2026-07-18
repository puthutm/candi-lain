import { NextResponse } from "next/server";
import { db } from "@/db";
import crypto from "crypto";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import * as jose from "jose";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Idempotency: prevent exchanging the same authorization code multiple times
    // (reload/multi-request can cause EXPIRED/ALREADY_USED issues)
    const codeHash = crypto.createHash("sha256").update(code).digest("base64url");
    const usedFlagKey = `sso_oauth_code_used_${codeHash}`;
    const usedAlready = cookieStore.get(usedFlagKey)?.value === "1";
    if (usedAlready) {
      return NextResponse.json(
        { success: false, error: "Authorization code already processed" },
        { status: 400 }
      );
    }

    // 1. Get code verifier from cookies
    let codeVerifier = cookieStore.get("sso_code_verifier")?.value;

    // Fallback: portal direct or PKCE verifier embedded inside `state`
    const state = searchParams.get("state");

    // Existing fallback for IdP-initiated login (SSO Portal Direct flow)
    if (!codeVerifier && state === "sso_portal_direct") {
      codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    }

    // New flow: PKCE verifier carried inside state as base64url(JSON) => { t: "pkce", v: "<verifier>" }
    if (!codeVerifier && state) {
      try {
        const decoded = Buffer.from(state, "base64url").toString("utf8");
        const parsed = JSON.parse(decoded);
        if (parsed?.t === "pkce" && typeof parsed?.v === "string") {
          codeVerifier = parsed.v;
        }
      } catch {
        // ignore invalid state payload
      }
    }

    if (!codeVerifier) {
      return NextResponse.json({ success: false, error: "Missing code verifier (cookie/state)" }, { status: 400 });
    }

    // 2. Call SSO token endpoint via HTTP POST (server-to-server)
    // IMPORTANT: redirect_uri must match EXACTLY (strict string compare) with the value stored by SSO
    // in `sso-platform/app/oauth/authorize/route.ts`.
    // Use the configured public callback URL instead of reconstructing from container hostname.
    const callbackUrl = env.SSO_OAUTH_CALLBACK_URL;

    const tokenResponse = await fetch(env.SSO_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.SSO_OAUTH_CLIENT_ID,
        client_secret: env.SSO_OAUTH_CLIENT_SECRET,
        code,
        code_verifier: codeVerifier,
        redirect_uri: callbackUrl,
      }),
    });

    if (tokenResponse.ok) {
      // Mark code as processed only after token exchange succeeds
      cookieStore.set(usedFlagKey, "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/callback",
        // align with typical auth code expiry; SSO default 600s
        maxAge: 600,
      });
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error_description || errorData.error || "Failed to exchange authorization code"
      }, { status: tokenResponse.status });
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing id_token in token response" }, { status: 400 });
    }

    // 3. Resolve JWKS URL and verify id_token JWT (RS256)
    const authorizeUrl = new URL(env.SSO_OAUTH_AUTHORIZE_URL);
    const jwksUrl = new URL("/.well-known/jwks.json", authorizeUrl.origin).toString();

    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: "urn:unsia:sso",
      audience: env.SSO_OAUTH_CLIENT_ID,
    });

    const userId = payload.sub as string;
    const fullName = payload.name as string;
    const email = payload.email as string;
    const username = payload.preferred_username as string;
    const roles = (payload.roles as string[]) || [];
    const role = roles.length > 0 ? roles[0] : "pendaftar";

    if (role === "pendaftar") {
      const existingCandidate = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.email, email))
        .limit(1);

      let candidateRecord;
      if (existingCandidate.length > 0) {
        candidateRecord = existingCandidate[0]!;
      } else {
        const activeWaves = await db
          .select()
          .from(pmbWaves)
          .where(eq(pmbWaves.status, "aktif"))
          .limit(1);
        const waveId = activeWaves[0]?.id;

        const entryPaths = await db
          .select()
          .from(pmbEntryPaths)
          .limit(1);
        const entryPathId = entryPaths[0]?.id;

        const studyPrograms = await db
          .select()
          .from(pmbStudyPrograms)
          .limit(1);
        const studyProgramId = studyPrograms[0]?.id;

        if (!waveId || !entryPathId || !studyProgramId) {
          return NextResponse.redirect(new URL("/?error=sso_meta_not_seeded", req.url));
        }

        const registrationNum = `PMB26-${Math.floor(10000 + Math.random() * 90000)}`;

        const [newCandidate] = await db
          .insert(pmbApplicants)
          .values({
            registrationNumber: registrationNum,
            fullName: fullName,
            email: email,
            phone: "08000000000",
            passwordHash: "SSO_AUTHENTICATED",
            waveId,
            entryPathId,
            studyProgramId,
            currentStage: "peminat",
            paymentStatus: "belum_bayar",
          })
          .returning();
        candidateRecord = newCandidate!;
      }

      cookieStore.set("pmb_user", JSON.stringify({
        userId: candidateRecord.id,
        name: candidateRecord.fullName,
        email: candidateRecord.email,
        role: "applicant",
        registrationNumber: candidateRecord.registrationNumber,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400,
      });

      // Clean up temporary verifier cookie
      cookieStore.delete("sso_code_verifier");

      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/?error=sso_only_for_staff", req.url));
    }

    // 4. Save session cookie for admin
    cookieStore.set("pmb_user", JSON.stringify({
      userId,
      name: fullName,
      username: username,
      role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
    });

    // Clean up temporary verifier cookie
    cookieStore.delete("sso_code_verifier");

    const redirectUrl = new URL("/admin", req.url);
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error: any) {
    console.error("SSO callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
