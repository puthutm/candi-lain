import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    // Redirect to NextAuth's expected callback path
    const nextAuthCallbackUrl = new URL(`/api/auth/callback/unsia-sso`, req.url);
    nextAuthCallbackUrl.search = searchParams.toString();
    
    return NextResponse.redirect(nextAuthCallbackUrl.toString());
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
