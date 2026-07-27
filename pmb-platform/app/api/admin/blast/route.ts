import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbMessageTemplates, pmbMessageLogs } from "@/db/schema/communication";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { sendWhatsApp, formatPhoneNumber } from "@/lib/whatsapp";

interface BlastRequest {
  templateId: string;
  channel: "email" | "whatsapp";
  segmentFilter?: {
    stage?: string;
    paymentStatus?: string;
    waveId?: string;
    studyProgramId?: string;
  };
  testEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BlastRequest = await request.json();
    const { templateId, channel, segmentFilter, testEmail } = body;

    if (!templateId || !channel) {
      return NextResponse.json(
        { error: "Template ID dan channel wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil template
    const [template] = await db
      .select()
      .from(pmbMessageTemplates)
      .where(eq(pmbMessageTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Jika test mode, kirim ke 1 email saja
    if (testEmail) {
      const result = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${template.subject || "Notifikasi PMB UNSIA"}`,
        html: template.body,
      });

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Test email berhasil dikirim ke ${testEmail}`
          : `Gagal: ${result.error}`,
        sentCount: result.success ? 1 : 0,
      });
    }

    // Ambil pendaftar berdasarkan filter
    const conditions = [];
    if (segmentFilter?.stage) {
      conditions.push(eq(pmbApplicants.currentStage, segmentFilter.stage as any));
    }
    if (segmentFilter?.paymentStatus) {
      conditions.push(eq(pmbApplicants.paymentStatus, segmentFilter.paymentStatus as any));
    }
    if (segmentFilter?.waveId) {
      conditions.push(eq(pmbApplicants.waveId, segmentFilter.waveId));
    }
    if (segmentFilter?.studyProgramId) {
      conditions.push(eq(pmbApplicants.studyProgramId, segmentFilter.studyProgramId));
    }

    const applicants = conditions.length > 0
      ? await db.select().from(pmbApplicants).where(and(...conditions))
      : await db.select().from(pmbApplicants);

    if (applicants.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada pendaftar yang sesuai dengan filter" },
        { status: 404 }
      );
    }

    // Kirim pesan ke setiap pendaftar
    let sentCount = 0;
    let failedCount = 0;

    for (const applicant of applicants) {
      try {
        const renderedBody = template.body
          .replace(/{nama}/g, applicant.fullName)
          .replace(/{name}/g, applicant.fullName)
          .replace(/{no_pendaftaran}/g, applicant.registrationNumber)
          .replace(/{registration_number}/g, applicant.registrationNumber)
          .replace(/{email}/g, applicant.email)
          .replace(/{tahapan}/g, applicant.currentStage)
          .replace(/{stage}/g, applicant.currentStage)
          .replace(/{status_pembayaran}/g, applicant.paymentStatus)
          .replace(/{payment_status}/g, applicant.paymentStatus)
          .replace(/{dashboard_url}/g, `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/dashboard`)
          .replace(/{app_url}/g, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002");

        let success = false;

        if (channel === "email") {
          const result = await sendEmail({
            to: applicant.email,
            subject: template.subject || "Notifikasi PMB UNSIA",
            html: renderedBody,
          });
          success = result.success;
        } else if (channel === "whatsapp") {
          const phone = formatPhoneNumber(applicant.phone);
          const result = await sendWhatsApp({
            to: phone,
            message: renderedBody,
          });
          success = result.success;
        }

        // Catat log
        await db.insert(pmbMessageLogs).values({
          applicantId: applicant.id,
          messageTemplateId: template.id,
          channel,
          status: success ? "terkirim" : "gagal",
          sentAt: new Date(),
        });

        if (success) sentCount++;
        else failedCount++;
      } catch (err) {
        failedCount++;
        console.error(`[Blast] Gagal kirim ke ${applicant.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Blast selesai: ${sentCount} terkirim, ${failedCount} gagal dari ${applicants.length} target`,
      sentCount,
      failedCount,
      totalTarget: applicants.length,
    });
  } catch (error) {
    console.error("[API Blast] Gagal:", error);
    return NextResponse.json({ error: "Gagal mengirim blast" }, { status: 500 });
  }
}
