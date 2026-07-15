import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { pmbCampaigns, pmbMessageLogs } from "@/db/schema/communication";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq, and, desc } from "drizzle-orm";

// GET all campaigns
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const list = await db
      .select()
      .from(pmbCampaigns)
      .orderBy(desc(pmbCampaigns.scheduledAt));

    return NextResponse.json({ success: true, campaigns: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST to create and send a campaign blast
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, segment, channel, message } = body;

    if (!name || !segment || !channel || !message) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // 1. Fetch matching applicants based on segment selection
    let query = db.select().from(pmbApplicants);
    let applicantsList = [];

    if (segment === "Tahap 4: Unggah Berkas (Belum Bayar)") {
      applicantsList = await db
        .select()
        .from(pmbApplicants)
        .where(
          and(
            eq(pmbApplicants.paymentStatus, "belum_bayar"),
            eq(pmbApplicants.currentStage, "unggah_berkas")
          )
        );
    } else if (segment === "Tahap 7: Selesai Ujian (Menunggu Kelulusan)") {
      applicantsList = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.currentStage, "selesai_ujian"));
    } else {
      // Semua Pendaftar Aktif
      applicantsList = await db
        .select()
        .from(pmbApplicants);
    }

    // 2. Insert Campaign record
    const [newCampaign] = await db
      .insert(pmbCampaigns)
      .values({
        name,
        segmentFilter: { segment, message },
        channel: channel as "email" | "whatsapp",
        status: "terkirim",
        sentCount: applicantsList.length,
        scheduledAt: new Date(),
      })
      .returning();

    if (!newCampaign) {
      throw new Error("Gagal membuat data kampanye");
    }

    // 3. Log messages for each applicant
    if (applicantsList.length > 0) {
      const logs = applicantsList.map((app) => ({
        applicantId: app.id,
        campaignId: newCampaign.id,
        channel: channel as "email" | "whatsapp",
        status: "terkirim" as const,
        sentAt: new Date(),
      }));

      await db.insert(pmbMessageLogs).values(logs);
    }

    return NextResponse.json({
      success: true,
      message: `Kampanye Blast '${name}' berhasil dikirim ke ${applicantsList.length} pendaftar!`,
      campaign: newCampaign,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
