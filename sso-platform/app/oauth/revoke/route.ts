import { NextResponse, type NextRequest } from "next/server";
import { TokenService } from "@/lib/services/token";
import { ClientService } from "@/lib/services/client";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Content-Type must be application/x-www-form-urlencoded" },
        { status: 400 }
      );
    }

    const text = await request.text();
    const body = new URLSearchParams(text);
    const token = body.get("token");

    if (!token) {
      return NextResponse.json({ error: "invalid_request", error_description: "Missing token parameter" }, { status: 400 });
    }

    // Authenticate client
    let clientId = body.get("client_id");
    let clientSecret = body.get("client_secret");

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const credentials = Buffer.from(authHeader.substring(6), "base64").toString("utf-8");
        const parts = credentials.split(":");
        clientId = parts[0] || null;
        clientSecret = parts[1] || null;
      } catch {}
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client authentication required" },
        { status: 401 }
      );
    }

    const app = await ClientService.getApplicationByClientId(clientId);
    if (!app || app.status !== "active") {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client credentials" },
        { status: 401 }
      );
    }

    const secretValid = await bcrypt.compare(clientSecret, app.clientSecretHash);
    if (!secretValid) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client credentials" },
        { status: 401 }
      );
    }

    const tokenTypeHint = body.get("token_type_hint");

    if (tokenTypeHint === "refresh_token") {
      await TokenService.revokeRefreshToken(token);
    } else if (tokenTypeHint === "access_token") {
      await TokenService.revokeAccessToken(token);
    } else {
      // Invalidate both if hint not provided or custom
      await TokenService.revokeRefreshToken(token);
      await TokenService.revokeAccessToken(token);
    }

    // RFC 7009 revoke endpoint responds with 200 OK
    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error("Revoke endpoint error:", err);
    return NextResponse.json({ error: "server_error", error_description: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
