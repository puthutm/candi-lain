import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    // Set legacy cookie for APIs
    const cookieStore = await cookies();
    cookieStore.set("lms_user", JSON.stringify({
      userId: (session.user as any).id,
      name: session.user.name,
      username: (session.user as any).username,
      role: (session.user as any).role,
    }), { path: "/", maxAge: 86400 });

    return NextResponse.json({ success: true, authenticated: true, user: session.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
