import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
  }

  const isHealthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      service: "bank-konten-platform",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}

export const dynamic = "force-dynamic";
