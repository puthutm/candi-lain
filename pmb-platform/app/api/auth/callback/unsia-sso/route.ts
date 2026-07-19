import { NextResponse } from "next/server";
import { handlers } from "@/auth";

/**
 * Wrapper to debug Auth.js callback cookie context for UNSIA SSO.
 * Goal: confirm PKCE/state/nonce cookies are present on THIS request:
 *   /api/auth/callback/unsia-sso
 *
 * If cookies are missing or named differently, Auth.js throws:
 *   InvalidCheck: state value could not be parsed
 *
 * Then we delegate to NextAuth/Auth.js built-in handlers.
 */

function hasCookie(cookieHeader: string, name: string) {
  return cookieHeader.includes(`${name}=`);
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const debug = {
      requestUrl: req.url,
      cookieHeaderPresent: Boolean(cookieHeader),
      has: {
        // PMB custom names
        "pmb.authjs.pkce.code_verifier": hasCookie(cookieHeader, "pmb.authjs.pkce.code_verifier"),
        "pmb.authjs.state": hasCookie(cookieHeader, "pmb.authjs.state"),
        "pmb.authjs.nonce": hasCookie(cookieHeader, "pmb.authjs.nonce"),

        // Auth.js default names (in case internal defaults are used)
        "authjs.pkce.code_verifier": hasCookie(cookieHeader, "authjs.pkce.code_verifier"),
        "authjs.state": hasCookie(cookieHeader, "authjs.state"),
        "authjs.nonce": hasCookie(cookieHeader, "authjs.nonce"),

        // CSRF / callback-url namespaces we do override
        "pmb.authjs.csrf-token": hasCookie(cookieHeader, "pmb.authjs.csrf-token"),
        "pmb.authjs.callback-url": hasCookie(cookieHeader, "pmb.authjs.callback-url"),

        // CSRF / callback-url defaults (just in case)
        "authjs.csrf-token": hasCookie(cookieHeader, "authjs.csrf-token"),
        "authjs.callback-url": hasCookie(cookieHeader, "authjs.callback-url"),
      },
    };

    console.error("[pmb][auth][callback][unsia-sso][cookie-debug]", debug);

    // Delegate to Auth.js handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (handlers as any).GET(req);
    return (await result) as any;
  } catch (e: any) {
    return NextResponse.json(
      { error: "Callback wrapper error", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Delegate similarly (POST sometimes used by Auth.js)
  const cookieHeader = req.headers.get("cookie") || "";

  console.error("[pmb][auth][callback][unsia-sso][cookie-debug][POST]", {
    cookieHeaderPresent: Boolean(cookieHeader),
    has: {
      "pmb.authjs.pkce.code_verifier": hasCookie(cookieHeader, "pmb.authjs.pkce.code_verifier"),
      "pmb.authjs.state": hasCookie(cookieHeader, "pmb.authjs.state"),
      "pmb.authjs.nonce": hasCookie(cookieHeader, "pmb.authjs.nonce"),
      "pmb.authjs.csrf-token": hasCookie(cookieHeader, "pmb.authjs.csrf-token"),
      "pmb.authjs.callback-url": hasCookie(cookieHeader, "pmb.authjs.callback-url"),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (handlers as any).POST(req);
  return (await result) as any;
}
