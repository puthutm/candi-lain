/**
 * Utility event publisher dari PMB ke SIAKAD saat pendaftar diterima & bayar daftar ulang
 */
export interface AcceptedApplicantPayload {
  pmbApplicantId: string;
  fullName: string;
  nik?: string;
  email: string;
  phone?: string;
  studyProgramId: string;
  entryPathCode?: string;
  waveCode?: string;
  acceptedDate: string;
  ssoUserId?: string;
}

export async function publishAcceptedApplicantToSiakad(payload: AcceptedApplicantPayload): Promise<{ success: boolean; nim?: string; message?: string }> {
  try {
    const siakadWebhookUrl = process.env.SIAKAD_WEBHOOK_URL || "http://localhost:3003/api/webhooks/pmb";

    console.log(`[PMB Publisher] Publishing applicant.accepted_and_paid event for ${payload.fullName} to ${siakadWebhookUrl}...`);

    const res = await fetch(siakadWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Name": "applicant.accepted_and_paid",
        "X-Source-System": "pmb_platform",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[PMB Publisher Warning] SIAKAD response status ${res.status}: ${errText}`);
      return { success: false, message: `SIAKAD endpoint returned status ${res.status}` };
    }

    const data = await res.json();
    console.log(`[PMB Publisher Success] SIAKAD Student Created:`, data);
    return { success: true, nim: data.student?.nim, message: "Pendaftar berhasil disinkronkan ke SIAKAD dan NIM terbentuk!" };
  } catch (error: any) {
    console.error(`[PMB Publisher Error] Failed to publish event to SIAKAD:`, error.message);
    return { success: false, message: error.message };
  }
}
