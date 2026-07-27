import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const issuer = env.JWT_ISSUER.replace(/\/+$/, "");
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  const config = {
    issuer,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    registration_endpoint: `${baseUrl}/api/admin/applications`,
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query", "fragment"],
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    token_endpoint_auth_signing_alg_values_supported: ["RS256"],
    claims_supported: [
      "sub",
      "name",
      "preferred_username",
      "email",
      "email_verified",
      "roles",
      "updated_at",
    ],
    claims_parameter_supported: false,
    request_parameter_supported: false,
    request_uri_parameter_supported: false,
    require_request_uri_registration: false,
    code_challenge_methods_supported: ["S256", "plain"],
    introspection_endpoint: `${baseUrl}/oauth/introspect`,
    introspection_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    revocation_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    end_session_endpoint: `${baseUrl}/oauth/logout`,
    backchannel_logout_supported: true,
    backchannel_logout_session_supported: true,
    frontchannel_logout_supported: true,
    frontchannel_logout_session_supported: true,
  };

  return NextResponse.json(config, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
