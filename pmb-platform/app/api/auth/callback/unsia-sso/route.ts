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
  // Delegate to Auth.js handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (handlers as any).GET(req);
  return (await result) as any;
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (handlers as any).POST(req);
  return (await result) as any;
}
