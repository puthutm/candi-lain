import { ensureDatabaseSeeded } from "@/lib/seed";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("==> Next.js Startup: Auto-seeding SSO database...");
    try {
      await ensureDatabaseSeeded();
      console.log("==> Next.js Startup: SSO database seeding completed successfully!");
    } catch (err: any) {
      console.error("==> Next.js Startup: SSO database seeding failed:", err.message);
    }
  }
}
