import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "10.10.20.56:3007";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const incomingUrl = new URL(request.url);
  const url = new URL("/auth/login", `${protocol}://${host}`);
  url.search = incomingUrl.search;
  return NextResponse.redirect(url);
}
