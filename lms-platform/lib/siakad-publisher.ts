/**
 * Utility publisher from LMS to SIAKAD for finalized course grades
 */
export interface FinalGradePayload {
  siakadClassId: string;
  studentUserId: string;
  finalScore: number;
  letterGrade: string;
  tugasScore?: number;
  utsScore?: number;
  uasScore?: number;
}

export async function publishFinalGradesToSiakad(
  payload: FinalGradePayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const siakadWebhookUrl =
      process.env.SIAKAD_WEBHOOK_URL || "http://localhost:3003/api/webhooks/lms";

    console.log(
      `[LMS Publisher] Publishing grade.finalized event for student ${payload.studentUserId} to ${siakadWebhookUrl}...`
    );

    const res = await fetch(siakadWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Name": "grade.finalized",
        "X-Source-System": "lms_icems_platform",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[LMS Publisher Warning] SIAKAD status ${res.status}: ${errText}`);
      return { success: false, message: `SIAKAD status ${res.status}` };
    }

    const data = await res.json();
    console.log(`[LMS Publisher Success] SIAKAD Response:`, data);
    return {
      success: true,
      message: "Nilai akhir berhasil disinkronkan dan dikirim ke SIAKAD!",
    };
  } catch (error: any) {
    console.error(`[LMS Publisher Error] Failed to publish grade to SIAKAD:`, error.message);
    return { success: false, message: error.message };
  }
}
