import { NextResponse } from "next/server";
import { TokenService } from "@/lib/services/token";

export async function GET() {
  try {
    const jwks = await TokenService.getJWKS();

    return NextResponse.json(jwks, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Content-Type": "application/jwk-set+json",
      },
    });
  } catch (err: any) {
    console.error("JWKS endpoint error:", err);
    return NextResponse.json(
      { error: "server_error", error_description: "Failed to generate JWKS" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
