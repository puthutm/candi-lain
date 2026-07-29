import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbStudyPrograms, pmbEntryPaths, pmbWaves } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Fetch applicant details
    const applicants = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        fullName: pmbApplicants.fullName,
        nik: pmbApplicants.nik,
        email: pmbApplicants.email,
        phone: pmbApplicants.phone,
        currentStage: pmbApplicants.currentStage,
        createdAt: pmbApplicants.createdAt,
        prodiName: pmbStudyPrograms.name,
        prodiCode: pmbStudyPrograms.code,
        entryPathName: pmbEntryPaths.name,
        waveName: pmbWaves.name,
      })
      .from(pmbApplicants)
      .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .where(eq(pmbApplicants.id, id));

    if (applicants.length === 0) {
      return NextResponse.json({ error: "Data pendaftar tidak ditemukan" }, { status: 404 });
    }

    const applicant = applicants[0]!;

    if (applicant.currentStage !== "diterima") {
      return NextResponse.json(
        { error: "Surat Penerimaan hanya dapat diterbitkan untuk pendaftar berstatus DITERIMA" },
        { status: 400 }
      );
    }

    const skNumber = `SK/PMB-UNSIA/2026/${applicant.registrationNumber}`;
    const qrVerifyUrl = `https://pmb.unsia.ac.id/verify/letter/${applicant.id}`;

    // Render official HTML document buffer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Surat Keputusan Penerimaan — ${applicant.fullName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 40px; color: #111; line-height: 1.6; }
          .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
          .title { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 16px; margin: 20px 0 5px; }
          .sk-num { text-align: center; font-size: 13px; margin-bottom: 25px; }
          .table-info { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table-info td { padding: 4px 8px; vertical-align: top; font-size: 14px; }
          .footer { margin-top: 40px; float: right; text-align: center; width: 250px; }
          .qr-box { margin-top: 30px; padding: 10px; border: 1px solid #ccc; font-size: 11px; text-align: center; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin:0; text-transform:uppercase;">UNIVERSITAS SIBER ASIA</h2>
          <p style="margin:0; font-size:12px;">Jl. Harsono RM No.1, Ragunan, Pasar Minggu, Jakarta Selatan 12550</p>
          <p style="margin:0; font-size:12px;">Situs Web: pmb.unsia.ac.id | Email: pmb@unsia.ac.id</p>
        </div>

        <div class="title">SURAT KEPUTUSAN PENERIMAAN MAHASISWA BARU</div>
        <div class="sk-num">Nomor: ${skNumber}</div>

        <p>Panitia Penerimaan Mahasiswa Baru Universitas Siber Asia (UNSIA) Tahun Akademik 2026/2027 berdasarkan hasil evaluasi berkas pendaftaran dan ujian Seleksi Masuk CBT menyatakan bahwa:</p>

        <table class="table-info">
          <tr><td width="30%">Nomor Pendaftaran</td><td width="5%">:</td><td><strong>${applicant.registrationNumber}</strong></td></tr>
          <tr><td>Nama Pendaftar</td><td>:</td><td><strong>${applicant.fullName}</strong></td></tr>
          <tr><td>NIK</td><td>:</td><td>${applicant.nik}</td></tr>
          <tr><td>Program Studi Diterima</td><td>:</td><td><strong>${applicant.prodiName} (${applicant.prodiCode})</strong></td></tr>
          <tr><td>Jalur Pendaftaran</td><td>:</td><td>${applicant.entryPathName}</td></tr>
          <tr><td>Gelombang</td><td>:</td><td>${applicant.waveName}</td></tr>
        </table>

        <p style="text-align: justify;">
          Dinyatakan <strong>DITERIMA SEBAGAI MAHASISWA BARU</strong> Universitas Siber Asia. Kepada calon mahasiswa yang bersangkutan diharapkan segera melakukan proses daftar ulang dan pembayaran registrasi perdana sesuai dengan jadwal yang telah ditentukan.
        </p>

        <div class="qr-box">
          <strong>KEABSAHAN DOKUMEN DIGITAL</strong><br />
          Dokumen ini diterbitkan secara elektronik oleh Panitia PMB UNSIA.<br />
          Kode Verifikasi QR: <code>${qrVerifyUrl}</code>
        </div>

        <div class="footer">
          <p>Jakarta, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p style="margin-top: 60px;"><strong>Panitia PMB UNSIA</strong><br />Universitas Siber Asia</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Surat_Penerimaan_${applicant.registrationNumber}.html"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
