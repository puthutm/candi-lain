import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "10.10.20.56:3006";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const url = new URL("/auth/login", `${protocol}://${host}`);
  return NextResponse.redirect(url);
}
