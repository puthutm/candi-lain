import { NextResponse, type NextRequest } from "next/server";
import { TokenService } from "@/lib/services/token";
import { ClientService } from "@/lib/services/client";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer error="invalid_token", error_description="Missing or invalid Authorization header"',
      },
    });
  }

  const token = authHeader.substring(7);
  const payload = await TokenService.verifyAccessToken(token);

  if (!payload) {
    return new NextResponse(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer error="invalid_token", error_description="The access token expired or is invalid"',
      },
    });
  }

  try {
    const clientId = payload.aud as string;
    const app = await ClientService.getApplicationByClientId(clientId);
    if (!app) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client application not found" },
        { status: 400 }
      );
    }

    const userInfo = await TokenService.getUserInfo(payload, app.id);
    return NextResponse.json(userInfo);
  } catch (err: any) {
    console.error("UserInfo endpoint error:", err);
    return NextResponse.json({ error: "server_error", error_description: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
