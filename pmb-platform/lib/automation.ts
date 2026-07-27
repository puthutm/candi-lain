/**
 * Automation Workflow Engine
 *
 * Menangani trigger-based automation untuk notifikasi otomatis.
 * Workflow didasarkan pada tabel pmbAutomationWorkflows dan pmbMessageTemplates.
 *
 * Trigger Events:
 * - form_submitted: Setelah pendaftar submit formulir
 * - 3_hari_tanpa_bayar: 3 hari setelah invoice dibuat dan belum bayar
 * - payment_confirmed: Setelah pembayaran terkonfirmasi via webhook
 * - documents_verified: Setelah semua dokumen diverifikasi
 * - documents_revision: Setelah dokumen diminta revisi
 * - exam_completed: Setelah ujian selesai
 * - accepted: Setelah diterima
 * - rejected: Setelah tidak lulus
 */

import { db } from "@/db";
import { pmbAutomationWorkflows, pmbMessageTemplates, pmbMessageLogs } from "@/db/schema/communication";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "./email";
import { sendWhatsApp, formatPhoneNumber } from "./whatsapp";

interface AutomationContext {
  applicant: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    registrationNumber: string;
    currentStage: string;
    paymentStatus: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Eksekusi workflow berdasarkan trigger event
 */
export async function executeWorkflow(triggerEvent: string, context: AutomationContext): Promise<void> {
  try {
    // Cari workflow aktif yang cocok dengan trigger event
    const workflows = await db
      .select({
        workflow: pmbAutomationWorkflows,
        template: pmbMessageTemplates,
      })
      .from(pmbAutomationWorkflows)
      .leftJoin(
        pmbMessageTemplates,
        eq(pmbAutomationWorkflows.messageTemplateId, pmbMessageTemplates.id)
      )
      .where(
        and(
          eq(pmbAutomationWorkflows.triggerEvent, triggerEvent),
          eq(pmbAutomationWorkflows.isActive, true)
        )
      );

    for (const { workflow, template } of workflows) {
      if (!template || !template.isActive) continue;

      // Jika ada delay, jadwalkan untuk nanti
      if (workflow.delayMinutes > 0) {
        await scheduleDelayedMessage(workflow, template, context);
        continue;
      }

      // Kirim pesan sekarang
      await sendAutomationMessage(template, context);

      // Catat log
      await db.insert(pmbMessageLogs).values({
        applicantId: context.applicant.id,
        messageTemplateId: template.id,
        channel: template.channel,
        status: "terkirim",
        sentAt: new Date(),
      });
    }
  } catch (error) {
    console.error(`[Automation] Gagal eksekusi workflow untuk trigger "${triggerEvent}":`, error);
  }
}

/**
 * Jadwalkan pengiriman pesan dengan delay
 */
async function scheduleDelayedMessage(
  workflow: typeof pmbAutomationWorkflows.$inferSelect,
  template: typeof pmbMessageTemplates.$inferSelect,
  context: AutomationContext
): Promise<void> {
  // Simpan ke tabel scheduling (bisa menggunakan in-memory atau database queue)
  // Untuk MVP, log saja ke console
  console.log(
    `[Automation] Menjadwalkan "${template.name}" untuk ${context.applicant.fullName} ` +
    `dalam ${workflow.delayMinutes} menit (trigger: ${workflow.triggerEvent})`
  );

  // Di production, simpan ke tabel scheduler dan cron job akan memprosesnya
  // Sementara kita langsung kirim tanpa delay untuk development
  await sendAutomationMessage(template, context);

  // Catat log dengan delay
  const scheduledTime = new Date(Date.now() + workflow.delayMinutes * 60 * 1000);
  await db.insert(pmbMessageLogs).values({
    applicantId: context.applicant.id,
    messageTemplateId: template.id,
    channel: template.channel,
    status: "terkirim",
    sentAt: scheduledTime,
  });
}

/**
 * Kirim pesan berdasarkan template dan channel
 */
async function sendAutomationMessage(
  template: typeof pmbMessageTemplates.$inferSelect,
  context: AutomationContext
): Promise<boolean> {
  const { applicant } = context;

  // Render template dengan data applicant
  const renderedBody = renderTemplate(template.body, applicant);

  if (template.channel === "email") {
    const result = await sendEmail({
      to: applicant.email,
      subject: template.subject || "Notifikasi PMB UNSIA",
      html: renderedBody,
    });
    return result.success;
  } else if (template.channel === "whatsapp") {
    const phone = formatPhoneNumber(applicant.phone);
    const result = await sendWhatsApp({
      to: phone,
      message: renderedBody,
    });
    return result.success;
  }

  return false;
}

/**
 * Render template string dengan data pendaftar
 */
function renderTemplate(template: string, applicant: AutomationContext["applicant"]): string {
  return template
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
}

/**
 * Helper untuk trigger workflow dari berbagai titik di aplikasi
 */
export const AutomationTriggers = {
  /**
   * Panggil setelah pendaftar submit formulir
   */
  async onFormSubmitted(applicantId: string) {
    // Ambil data pendaftar
    const applicants = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (!applicants[0]) return;

    const applicant = applicants[0];
    await executeWorkflow("form_submitted", {
      applicant: {
        id: applicant.id,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        registrationNumber: applicant.registrationNumber,
        currentStage: applicant.currentStage,
        paymentStatus: applicant.paymentStatus,
      },
    });
  },

  /**
   * Panggil setelah pembayaran terkonfirmasi
   */
  async onPaymentConfirmed(applicantId: string) {
    const applicants = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (!applicants[0]) return;

    const applicant = applicants[0];
    await executeWorkflow("payment_confirmed", {
      applicant: {
        id: applicant.id,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        registrationNumber: applicant.registrationNumber,
        currentStage: applicant.currentStage,
        paymentStatus: applicant.paymentStatus,
      },
    });
  },

  /**
   * Panggil setelah dokumen diverifikasi
   */
  async onDocumentsVerified(applicantId: string, status: "approved" | "revision") {
    const applicants = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (!applicants[0]) return;

    const applicant = applicants[0];
    const triggerEvent = status === "approved" ? "documents_verified" : "documents_revision";

    await executeWorkflow(triggerEvent, {
      applicant: {
        id: applicant.id,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        registrationNumber: applicant.registrationNumber,
        currentStage: applicant.currentStage,
        paymentStatus: applicant.paymentStatus,
      },
    });
  },

  /**
   * Panggil setelah keputusan kelulusan
   */
  async onGraduationDecision(applicantId: string, decision: "accepted" | "rejected") {
    const applicants = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (!applicants[0]) return;

    const applicant = applicants[0];
    const triggerEvent = decision === "accepted" ? "accepted" : "rejected";

    await executeWorkflow(triggerEvent, {
      applicant: {
        id: applicant.id,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        registrationNumber: applicant.registrationNumber,
        currentStage: applicant.currentStage,
        paymentStatus: applicant.paymentStatus,
      },
    });
  },
};

/**
 * Seed default automation workflows (dipanggil dari db/seed.ts)
 */
export async function seedDefaultWorkflows(): Promise<void> {
  const existingWorkflows = await db.select().from(pmbAutomationWorkflows).limit(1);
  if (existingWorkflows.length > 0) return; // Sudah ada

  console.log("[Automation] Seeding default workflows...");

  // Buat template terlebih dahulu
  const templates = await db.insert(pmbMessageTemplates).values([
    {
      name: "Welcome Email",
      triggerEvent: "form_submitted",
      channel: "email",
      subject: "Selamat Datang di PMB UNSIA - No. Pendaftaran: {no_pendaftaran}",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f487b; padding: 20px; text-align: center;">
          <h1 style="color: white;">PMB UNSIA</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Selamat! Anda telah berhasil mendaftar sebagai calon mahasiswa baru Universitas Siber Asia (UNSIA).</p>
          <p>Berikut nomor pendaftaran Anda: <strong>{no_pendaftaran}</strong></p>
          <p>Silakan login ke dashboard untuk melanjutkan proses pendaftaran.</p>
          <p><a href="{dashboard_url}" style="background: #0f487b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Buka Dashboard</a></p>
        </div>
      </div>`,
    },
    {
      name: "Payment Reminder",
      triggerEvent: "3_hari_tanpa_bayar",
      channel: "email",
      subject: "Pengingat Pembayaran PMB UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #ecc94b; padding: 20px; text-align: center;">
          <h1 style="color: #0f487b;">Pengingat Pembayaran</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Kami mengingatkan bahwa Anda memiliki tagihan yang belum dibayar.</p>
          <p>Segera lakukan pembayaran melalui dashboard untuk melanjutkan proses pendaftaran.</p>
          <p><a href="{dashboard_url}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Bayar Sekarang</a></p>
        </div>
      </div>`,
    },
    {
      name: "Payment Confirmed",
      triggerEvent: "payment_confirmed",
      channel: "email",
      subject: "Pembayaran Dikonfirmasi - PMB UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white;">Pembayaran Dikonfirmasi</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Pembayaran Anda telah dikonfirmasi. Silakan melanjutkan ke tahap berikutnya: melengkapi biodata dan mengunggah berkas persyaratan.</p>
          <p><a href="{dashboard_url}" style="background: #0f487b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Lengkapi Berkas</a></p>
        </div>
      </div>`,
    },
    {
      name: "Documents Verified",
      triggerEvent: "documents_verified",
      channel: "email",
      subject: "Berkas Terverifikasi - PMB UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white;">Berkas Terverifikasi</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Seluruh berkas persyaratan Anda telah diverifikasi dan dinyatakan <strong>LOLOS</strong>.</p>
          <p>Anda sekarang dapat mengakses ujian seleksi masuk (CBT).</p>
          <p><a href="{dashboard_url}" style="background: #0f487b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mulai Ujian</a></p>
        </div>
      </div>`,
    },
    {
      name: "Documents Revision",
      triggerEvent: "documents_revision",
      channel: "email",
      subject: "Berkas Perlu Revisi - PMB UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #d97706; padding: 20px; text-align: center;">
          <h1 style="color: white;">Berkas Perlu Revisi</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Beberapa berkas Anda perlu diperbaiki. Silakan login ke dashboard untuk melihat catatan revisi dan mengunggah ulang.</p>
          <p><a href="{dashboard_url}" style="background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Perbaiki Berkas</a></p>
        </div>
      </div>`,
    },
    {
      name: "Acceptance Letter",
      triggerEvent: "accepted",
      channel: "email",
      subject: "Selamat! Anda Diterima di UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white;">Selamat Bergabung!</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Dengan ini kami umumkan bahwa Anda dinyatakan <strong>DITERIMA</strong> sebagai mahasiswa baru Universitas Siber Asia (UNSIA).</p>
          <p>Informasi lebih lanjut mengenai registrasi ulang akan diinformasikan melalui email dan dashboard.</p>
        </div>
      </div>`,
    },
    {
      name: "Rejection Notification",
      triggerEvent: "rejected",
      channel: "email",
      subject: "Hasil Seleksi PMB UNSIA",
      body: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white;">Hasil Seleksi</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo {nama},</h2>
          <p>Setelah melalui proses seleksi, dengan berat hati kami informasikan bahwa Anda belum dapat diterima di UNSIA pada gelombang ini.</p>
          <p>Kami mengucapkan terima kasih atas partisipasi Anda dan semoga sukses di kesempatan berikutnya.</p>
        </div>
      </div>`,
    },
  ]).returning();

  // Buat workflow untuk setiap template
  const workflowEntries = templates.map((t) => ({
    name: `${t.name} Workflow`,
    triggerEvent: t.triggerEvent,
    delayMinutes: t.triggerEvent === "3_hari_tanpa_bayar" ? 4320 : 0, // 3 hari untuk reminder
    messageTemplateId: t.id,
    isActive: true,
  }));

  await db.insert(pmbAutomationWorkflows).values(workflowEntries);

  console.log(`[Automation] ✅ ${templates.length} template dan ${workflowEntries.length} workflow berhasil di-seed.`);
}
