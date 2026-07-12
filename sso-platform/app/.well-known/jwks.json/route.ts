import { NextResponse } from "next/server";
import { TokenService } from "@/lib/services/token";

export async function GET() {
  try {
    const jwks = await TokenService.getJWKS();
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("JWKS endpoint error:", err);
    return NextResponse.json({ error: "Failed to retrieve JWKS" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
