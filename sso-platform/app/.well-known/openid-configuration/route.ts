import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const issuer = env.JWT_ISSUER || "http://localhost:3000";

  const config = {
    issuer,
    authorization_endpoint: `${appUrl}/oauth/authorize`,
    token_endpoint: `${appUrl}/oauth/token`,
    userinfo_endpoint: `${appUrl}/oauth/userinfo`,
    jwks_uri: `${appUrl}/.well-known/jwks.json`,
    revocation_endpoint: `${appUrl}/oauth/revoke`,
    introspection_endpoint: `${appUrl}/oauth/introspect`,
    scopes_supported: ["openid", "profile", "email"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256", "plain"],
  };

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
export const dynamic = "force-dynamic";
