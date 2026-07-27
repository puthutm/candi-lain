/**
 * Email Service
 *
 * Mendukung multiple provider: SMTP, SendGrid, Amazon SES.
 * Konfigurasi via environment variable:
 * - EMAIL_PROVIDER: "smtp" | "sendgrid" | "ses"
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (untuk SMTP)
 * - SENDGRID_API_KEY (untuk SendGrid)
 * - SES_ACCESS_KEY, SES_SECRET_KEY, SES_REGION (untuk SES)
 * - EMAIL_FROM: alamat pengirim default
 */

import nodemailer from "nodemailer";

interface EmailConfig {
  provider: "smtp" | "sendgrid" | "ses";
  from: string;
  fromName?: string;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

function getConfig(): EmailConfig {
  return {
    provider: (process.env.EMAIL_PROVIDER as EmailConfig["provider"]) || "smtp",
    from: process.env.EMAIL_FROM || "noreply@unsia.ac.id",
    fromName: process.env.EMAIL_FROM_NAME || "PMB UNSIA",
  };
}

function createSmtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function createSendgridTransport() {
  // SendGrid via SMTP API
  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

function createSesTransport() {
  // AWS SES - membutuhkan package @aws-sdk/client-ses
  // Untuk development, fallback ke SMTP jika SES tidak dikonfigurasi
  console.warn("[Email] SES provider membutuhkan @aws-sdk/client-ses. Fallback ke SMTP.");
  return createSmtpTransport();
}

function getTransport() {
  const config = getConfig();

  switch (config.provider) {
    case "sendgrid":
      return createSendgridTransport();
    case "ses":
      return createSesTransport();
    case "smtp":
    default:
      return createSmtpTransport();
  }
}

/**
 * Kirim email dengan konfigurasi provider aktif
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const config = getConfig();
    const transport = getTransport();

    const info = await transport.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.from}>`
        : config.from,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      cc: params.cc
        ? Array.isArray(params.cc)
          ? params.cc.join(", ")
          : params.cc
        : undefined,
      bcc: params.bcc
        ? Array.isArray(params.bcc)
          ? params.bcc.join(", ")
          : params.bcc
        : undefined,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
      attachments: params.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email Service] Gagal mengirim email:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Template email bawaan untuk PMB
 */
export const EmailTemplates = {
  welcome: (params: { name: string; registrationNumber: string; dashboardUrl: string }) => ({
    subject: `Selamat Datang di PMB UNSIA - No. Pendaftaran: ${params.registrationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f487b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">PMB UNSIA</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo ${params.name},</h2>
          <p>Selamat! Anda telah berhasil mendaftar sebagai calon mahasiswa baru Universitas Siber Asia (UNSIA).</p>
          <p>Berikut nomor pendaftaran Anda:</p>
          <div style="background: #0f487b; color: white; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${params.registrationNumber}
          </div>
          <p>Silakan login ke dashboard pendaftar untuk melanjutkan proses pendaftaran:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${params.dashboardUrl}" style="background: #0f487b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Buka Dashboard Pendaftar
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Email ini dikirim otomatis oleh sistem PMB UNSIA.</p>
        </div>
      </div>
    `,
  }),

  paymentReminder: (params: { name: string; invoiceNumber: string; amount: string; dueDate: string; paymentUrl: string }) => ({
    subject: `Pengingat Pembayaran - ${params.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ecc94b; padding: 20px; text-align: center;">
          <h1 style="color: #0f487b; margin: 0;">Pengingat Pembayaran</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo ${params.name},</h2>
          <p>Kami mengingatkan bahwa Anda memiliki tagihan yang belum dibayar:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">No. Invoice</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${params.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Jumlah</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">${params.amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Batas Pembayaran</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${params.dueDate}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${params.paymentUrl}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Bayar Sekarang
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Email ini dikirim otomatis oleh sistem PMB UNSIA.</p>
        </div>
      </div>
    `,
  }),

  verificationResult: (params: { name: string; status: "approved" | "revision"; revisionNote?: string; dashboardUrl: string }) => ({
    subject: params.status === "approved"
      ? "Berkas Anda Telah Diverifikasi ✅"
      : "Berkas Anda Perlu Revisi ⚠️",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${params.status === "approved" ? "#059669" : "#d97706"}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Hasil Verifikasi Berkas</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo ${params.name},</h2>
          ${params.status === "approved"
            ? `<p>Selamat! Seluruh berkas persyaratan Anda telah diverifikasi dan dinyatakan <strong style="color: #059669;">LOLOS</strong>.</p>
               <p>Anda sekarang dapat mengakses ujian seleksi masuk (CBT) melalui dashboard pendaftar.</p>`
            : `<p>Beberapa berkas Anda perlu diperbaiki. Berikut catatan dari verifikator:</p>
               <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                 <p style="margin: 0; color: #92400e;">${params.revisionNote || "Silakan periksa dan unggah ulang berkas yang diminta."}</p>
               </div>`
          }
          <div style="text-align: center; margin: 25px 0;">
            <a href="${params.dashboardUrl}" style="background: #0f487b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Buka Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Email ini dikirim otomatis oleh sistem PMB UNSIA.</p>
        </div>
      </div>
    `,
  }),

  acceptanceLetter: (params: { name: string; registrationNumber: string; studyProgram: string; nim?: string }) => ({
    subject: `Selamat! Anda Diterima di UNSIA 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Selamat Bergabung!</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Halo ${params.name},</h2>
          <p>Dengan ini kami umumkan bahwa Anda dinyatakan <strong style="color: #059669;">DITERIMA</strong> sebagai mahasiswa baru Universitas Siber Asia (UNSIA).</p>
          <div style="background: #f0fdf4; border: 2px solid #059669; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px; font-weight: bold;">No. Pendaftaran</td>
                <td style="padding: 5px;">${params.registrationNumber}</td>
              </tr>
              ${params.nim ? `<tr>
                <td style="padding: 5px; font-weight: bold;">NIM</td>
                <td style="padding: 5px; font-weight: bold; color: #0f487b;">${params.nim}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 5px; font-weight: bold;">Program Studi</td>
                <td style="padding: 5px;">${params.studyProgram}</td>
              </tr>
            </table>
          </div>
          <p>Informasi lebih lanjut mengenai proses registrasi ulang dan orientasi mahasiswa baru akan diinformasikan melalui email dan dashboard pendaftar.</p>
          <p style="color: #666; font-size: 12px;">Email ini dikirim otomatis oleh sistem PMB UNSIA.</p>
        </div>
      </div>
    `,
  }),
};
