import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/api/auth/signin/unsia-sso", request.url);
  return NextResponse.redirect(url);
}
