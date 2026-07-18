import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    // Redirect to NextAuth's expected callback path.
    // IMPORTANT: use PUBLIC URL so redirect doesn't inherit internal docker Hostnames.
    const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!publicBaseUrl) {
      return NextResponse.json(
        { success: false, error: "Missing env NEXT_PUBLIC_APP_URL (public base URL for redirects)" },
        { status: 500 }
      );
    }

    // Use the public callback URL env to guarantee it always resolves to the public host.
    // (req.url may contain internal docker hostname)
    const publicCallbackBase =
      process.env.NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL || process.env.SSO_OAUTH_CALLBACK_URL;

    const nextAuthCallbackUrl = publicCallbackBase
      ? new URL("/api/auth/callback/unsia-sso", publicCallbackBase)
      : new URL("/api/auth/callback/unsia-sso", publicBaseUrl);
    nextAuthCallbackUrl.search = searchParams.toString();

    return NextResponse.redirect(nextAuthCallbackUrl.toString());
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
