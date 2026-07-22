import { ensureDatabaseSeeded } from "@/lib/seed";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_SEED_IN_PROD) {
      console.log("==> Next.js Startup: Production environment detected. Skipping automatic test database seeding.");
      return;
    }

    console.log("==> Next.js Startup: Auto-seeding SSO database...");
    try {
      await ensureDatabaseSeeded();
      console.log("==> Next.js Startup: SSO database seeding completed successfully!");
    } catch (err: any) {
      console.error("==> Next.js Startup: SSO database seeding failed:", err.message);
    }
  }
}

