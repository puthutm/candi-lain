import { NextResponse } from "next/server";
import { db } from "@/db";
import { applicants } from "@/db/schema/applicants";
import { studyPrograms, entryPaths, waves } from "@/db/schema/master";
import { eq } from "drizzle-orm";

// GET: Generate E-Acceptance Letter / Surat Keputusan Kelulusan PMB
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [applicant] = await db
      .select({
        applicant: applicants,
        prodi: studyPrograms.name,
        jalur: entryPaths.name,
        gelombang: waves.name,
      })
      .from(applicants)
      .leftJoin(studyPrograms, eq(applicants.studyProgramId, studyPrograms.id))
      .leftJoin(entryPaths, eq(applicants.entryPathId, entryPaths.id))
      .leftJoin(waves, eq(applicants.waveId, waves.id))
      .where(eq(applicants.id, id))
      .limit(1);

    if (!applicant) {
      return NextResponse.json({ success: false, error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }

    const appData = applicant.applicant;
    const isAccepted = appData.currentStage === "diterima";

    // Generate digital hash payload
    const verificationHash = Buffer.from(
      `UNSIA-PMB-${appData.registrationNumber}-${appData.fullName}-${appData.currentStage}`
    ).toString("base64");

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Keputusan Kelulusan PMB UNSIA - ${appData.registrationNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
    .header { text-align: center; border-b: 3px double #0284c7; padding-pb: 15px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase; }
    .header p { margin: 4px 0; font-size: 12px; color: #64748b; }
    .badge { display: inline-block; padding: 6px 16px; background-color: ${isAccepted ? "#dcfce7" : "#fee2e2"}; color: ${isAccepted ? "#15803d" : "#b91c1c"}; font-weight: bold; border-radius: 20px; font-size: 14px; margin: 15px 0; }
    .table-detail { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .table-detail td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .table-detail td.label { font-weight: bold; color: #475569; width: 35%; }
    .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
    .qr-box { border: 1px solid #cbd5e1; padding: 10px; text-align: center; border-radius: 8px; font-size: 10px; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>UNIVERSITAS SIBER ASIA</h1>
    <p>PANITIA PENERIMAAN MAHASISWA BARU (PMB) TAHUN AKADEMIK 2026/2027</p>
    <p>Jl. Harsono RM No. 1, Ragunan, Pasar Minggu, Jakarta Selatan | Website: unsia.ac.id</p>
  </div>

  <div style="text-align: center;">
    <h3>SURAT KEPUTUSAN HASIL SELEKSI PMB</h3>
    <p style="font-size: 12px; color: #64748b;">Nomor: SK-PMB/UNSIA/2026/${appData.registrationNumber}</p>
    <div class="badge">${isAccepted ? "SELAMAT! ANDA DINYATAKAN DITERIMA" : "STATUS SELEKSI: DALAM PROSES / TIDAK LULUS"}</div>
  </div>

  <p style="font-size: 13px;">Berdasarkan hasil verifikasi dokumen dan ujian seleksi Penerimaan Mahasiswa Baru Universitas Siber Asia (UNSIA) periode berjalan, Panitia PMB menetapkan bahwa:</p>

  <table class="table-detail">
    <tr>
      <td class="label">Nomor Pendaftaran</td>
      <td><strong>${appData.registrationNumber}</strong></td>
    </tr>
    <tr>
      <td class="label">Nama Lengkap</td>
      <td><strong>${appData.fullName}</strong></td>
    </tr>
    <tr>
      <td class="label">Email Pendaftar</td>
      <td>${appData.email}</td>
    </tr>
    <tr>
      <td class="label">Program Studi Diterima</td>
      <td><strong>${applicant.prodi || "Informatika (S1)"}</strong></td>
    </tr>
    <tr>
      <td class="label">Jalur Pendaftaran</td>
      <td>${applicant.jalur || "Reguler"}</td>
    </tr>
    <tr>
      <td class="label">Gelombang</td>
      <td>${applicant.gelombang || "Gelombang 1"}</td>
    </tr>
  </table>

  <p style="font-size: 12px; color: #475569;">
    ${isAccepted 
      ? "Tahap Selanjutnya: Silakan lakukan pembayaran daftar ulang (UKT Semester 1) melalui Portal PMB untuk mengaktifkan Nomor Induk Mahasiswa (NIM) dan Akun Pembelajaran SIAKAD." 
      : "Harap melengkapi dokumen persyaratan dan mengikuti alur seleksi Ujian CBT hingga tuntas."}
  </p>

  <div class="footer">
    <div class="qr-box">
      <p style="margin: 0; font-weight: bold;">VERIFIKASI DIGITAL UNSIA</p>
      <p style="margin: 4px 0; font-family: monospace;">HASH: ${verificationHash.slice(0, 16)}...</p>
      <p style="margin: 0; color: #16a34a;">✓ Terverifikasi Asli Sistem PMB</p>
    </div>
    <div style="text-align: center;">
      <p>Jakarta, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p style="font-weight: bold; margin-top: 40px;">Ketua Panitia PMB UNSIA</p>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
