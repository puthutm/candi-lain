/**
 * WhatsApp Messaging Service
 *
 * Mendukung multiple provider: WhatsApp Business API, Fonnte, Wablas.
 * Konfigurasi via environment variable:
 * - WHATSAPP_PROVIDER: "whatsapp_business" | "fonnte" | "wablas"
 * - WHATSAPP_API_KEY / FONNTE_API_KEY / WABLAS_API_KEY
 * - WHATSAPP_PHONE_NUMBER_ID (untuk WhatsApp Business API)
 * - WHATSAPP_BUSINESS_ACCOUNT_ID (untuk WhatsApp Business API)
 */

interface WhatsAppConfig {
  provider: "whatsapp_business" | "fonnte" | "wablas";
}

interface SendWhatsAppParams {
  to: string; // Nomor tujuan, format: 628xxx (tanpa + atau spasi)
  message: string;
  imageUrl?: string;
  documentUrl?: string;
  documentFilename?: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getConfig(): WhatsAppConfig {
  return {
    provider: (process.env.WHATSAPP_PROVIDER as WhatsAppConfig["provider"]) || "whatsapp_business",
  };
}

/**
 * Kirim WhatsApp via WhatsApp Business API (Meta/Cloud API)
 */
async function sendViaWhatsAppBusiness(params: SendWhatsAppParams): Promise<WhatsAppResponse> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!phoneNumberId || !apiKey) {
    return { success: false, error: "WHATSAPP_PHONE_NUMBER_ID dan WHATSAPP_API_KEY harus dikonfigurasi" };
  }

  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: params.imageUrl ? "image" : params.documentUrl ? "document" : "text",
    };

    if (params.imageUrl) {
      body.image = { link: params.imageUrl };
      if (params.message) {
        body.caption = params.message;
      }
    } else if (params.documentUrl) {
      body.document = {
        link: params.documentUrl,
        filename: params.documentFilename || "dokumen.pdf",
      };
      if (params.message) {
        body.caption = params.message;
      }
    } else {
      body.text = { body: params.message, preview_url: true };
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error?.message || `WhatsApp API error (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Kirim WhatsApp via Fonnte
 */
async function sendViaFonnte(params: SendWhatsAppParams): Promise<WhatsAppResponse> {
  const apiKey = process.env.FONNTE_API_KEY;

  if (!apiKey) {
    return { success: false, error: "FONNTE_API_KEY harus dikonfigurasi" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("target", params.to);
    formData.append("message", params.message);

    if (params.imageUrl) {
      formData.append("image", params.imageUrl);
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok || result.status === false) {
      return { success: false, error: result.reason || "Fonnte error" };
    }

    return {
      success: true,
      messageId: result.id || undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Kirim WhatsApp via Wablas
 */
async function sendViaWablas(params: SendWhatsAppParams): Promise<WhatsAppResponse> {
  const apiKey = process.env.WABLAS_API_KEY;
  const wablasDomain = process.env.WABLAS_DOMAIN || "https://solo.wablas.com";

  if (!apiKey) {
    return { success: false, error: "WABLAS_API_KEY harus dikonfigurasi" };
  }

  try {
    const response = await fetch(`${wablasDomain}/api/send-message`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: params.to,
        message: params.message,
        image: params.imageUrl || undefined,
        document: params.documentUrl || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status === false) {
      return { success: false, error: result.message || "Wablas error" };
    }

    return {
      success: true,
      messageId: result.data?.id || undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Kirim WhatsApp dengan provider yang aktif
 */
export async function sendWhatsApp(params: SendWhatsAppParams): Promise<WhatsAppResponse> {
  const config = getConfig();

  switch (config.provider) {
    case "fonnte":
      return sendViaFonnte(params);
    case "wablas":
      return sendViaWablas(params);
    case "whatsapp_business":
    default:
      return sendViaWhatsAppBusiness(params);
  }
}

/**
 * Format nomor telepon untuk WhatsApp (hilangkan +, 0, spasi)
 */
export function formatPhoneNumber(phone: string): string {
  // Hapus semua karakter non-digit
  let cleaned = phone.replace(/\D/g, "");

  // Jika diawali 0, ganti dengan 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  // Jika diawali +62, hilangkan +
  else if (cleaned.startsWith("62")) {
    cleaned = "62" + cleaned.slice(2);
  }
  // Jika diawali 62, biarkan

  return cleaned;
}

/**
 * Template pesan WhatsApp bawaan untuk PMB
 */
export const WhatsAppTemplates = {
  welcome: (params: { name: string; registrationNumber: string }) =>
    `Halo ${params.name}!\n\n` +
    `Selamat bergabung di PMB UNSIA! 🎉\n\n` +
    `Nomor Pendaftaran Anda:\n*${params.registrationNumber}*\n\n` +
    `Silakan login ke dashboard untuk melanjutkan:\n` +
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\n` +
    `Terima kasih 🙏`,

  paymentReminder: (params: { name: string; amount: string; dueDate: string }) =>
    `Halo ${params.name}!\n\n` +
    `*⚠️ PENGINGAT PEMBAYARAN*\n\n` +
    `Anda memiliki tagihan sebesar *${params.amount}* yang harus dibayar sebelum *${params.dueDate}*.\n\n` +
    `Segera lakukan pembayaran melalui dashboard:\n` +
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=tagihan\n\n` +
    `Terima kasih 🙏`,

  verificationApproved: (params: { name: string }) =>
    `Halo ${params.name}!\n\n` +
    `*✅ BERKAS ANDA TELAH DIVERIFIKASI*\n\n` +
    `Seluruh dokumen persyaratan Anda telah dinyatakan LOLOS. 🎉\n\n` +
    `Anda sekarang dapat mengakses ujian seleksi masuk (CBT) melalui dashboard:\n` +
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\n` +
    `Semoga sukses! 💪`,

  verificationRevision: (params: { name: string; note: string }) =>
    `Halo ${params.name}!\n\n` +
    `*⚠️ BERKAS PERLU REVISI*\n\n` +
    `Beberapa dokumen Anda perlu diperbaiki:\n${params.note}\n\n` +
    `Silakan login ke dashboard untuk mengunggah ulang:\n` +
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\n` +
    `Terima kasih 🙏`,

  acceptance: (params: { name: string; studyProgram: string }) =>
    `Halo ${params.name}!\n\n` +
    `*🎉 SELAMAT! ANDA DITERIMA*\n\n` +
    `Kami dengan bangga mengumumkan bahwa Anda *DITERIMA* sebagai mahasiswa baru UNSIA.\n\n` +
    `Program Studi: *${params.studyProgram}*\n\n` +
    `Informasi lebih lanjut akan dikirimkan melalui email.\n` +
    `Selamat bergabung! 🎓`,
};
