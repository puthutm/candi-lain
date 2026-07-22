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

const getNextauthParams = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const prefix = "/api/auth/";
    if (pathname.startsWith(prefix)) {
      const remaining = pathname.substring(prefix.length);
      if (remaining) {
        return remaining.split("/");
      }
    }
  } catch {}
  return undefined;
};

const wrappedGet = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  console.error("[pmb][auth][wrappedGet][debug]", {
    reqUrl: req.url,
    reqHeaders: Object.fromEntries(req.headers.entries()),
    args: JSON.stringify(args)
  });

  let modifiedReq = req;
  let modifiedArgs = args;

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      modifiedReq = new NextRequest(urlObj.toString(), req);
      console.error("[pmb][auth][wrappedGet][modified]", {
        modifiedUrl: modifiedReq.url,
        nextUrlPath: modifiedReq.nextUrl?.pathname
      });
    }
  }

  const parsedParams = getNextauthParams(modifiedReq.url);
  console.error("[pmb][auth][wrappedGet][params]", { parsedParams });

  if (parsedParams) {
    const context = args[0] || {};
    context.params = { nextauth: parsedParams };
    modifiedArgs = [context, ...args.slice(1)];
  }

  return (originalGet as any)(modifiedReq, ...modifiedArgs);
};

const wrappedPost = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  let modifiedReq = req;
  let modifiedArgs = args;

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      modifiedReq = new NextRequest(urlObj.toString(), req);
    }
  }

  const parsedParams = getNextauthParams(modifiedReq.url);
  if (parsedParams) {
    const context = args[0] || {};
    context.params = { nextauth: parsedParams };
    modifiedArgs = [context, ...args.slice(1)];
  }

  return (originalPost as any)(modifiedReq, ...modifiedArgs);
};

export const handlers = { GET: wrappedGet, POST: wrappedPost };
export const { auth, signIn, signOut } = parsedNextAuth;
