import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { authConfig } from "./auth.config";

console.info("[pmb][auth][provider-env]", {
  hasClientId: Boolean(env.SSO_OAUTH_CLIENT_ID),
  hasClientSecret: Boolean(env.SSO_OAUTH_CLIENT_SECRET),
  tokenUrl: env.SSO_OAUTH_TOKEN_URL ? new URL(env.SSO_OAUTH_TOKEN_URL).host : null,
});

const parsedNextAuth = NextAuth(authConfig);

const originalGet = parsedNextAuth.handlers.GET;
const originalPost = parsedNextAuth.handlers.POST;

const wrappedGet = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  console.error("[pmb][auth][wrappedGet][debug]", {
    originalUrl: req.url,
    host,
    protocol,
    args: JSON.stringify(args),
  });

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      const modifiedReq = new NextRequest(urlObj.toString(), req);
      console.error("[pmb][auth][wrappedGet][modified]", {
        modifiedUrl: modifiedReq.url,
        nextUrlPath: modifiedReq.nextUrl?.pathname,
      });
      return (originalGet as any)(modifiedReq, ...args);
    }
  }
  return (originalGet as any)(req, ...args);
};

const wrappedPost = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  console.error("[pmb][auth][wrappedPost][debug]", {
    originalUrl: req.url,
    host,
    protocol,
    args: JSON.stringify(args),
  });

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      const modifiedReq = new NextRequest(urlObj.toString(), req);
      console.error("[pmb][auth][wrappedPost][modified]", {
        modifiedUrl: modifiedReq.url,
        nextUrlPath: modifiedReq.nextUrl?.pathname,
      });
      return (originalPost as any)(modifiedReq, ...args);
    }
  }
  return (originalPost as any)(req, ...args);
};

export const handlers = { GET: wrappedGet, POST: wrappedPost };
export const { auth, signIn, signOut } = parsedNextAuth;
