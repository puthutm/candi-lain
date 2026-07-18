import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { pmbApplicantDocuments, pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    
    // Find candidate documents matching this filename
    const documents = await db
      .select({
        id: pmbApplicantDocuments.id,
        applicantId: pmbApplicantDocuments.applicantId,
        fileUrl: pmbApplicantDocuments.fileUrl,
        email: pmbApplicants.email,
      })
      .from(pmbApplicantDocuments)
      .innerJoin(pmbApplicants, eq(pmbApplicantDocuments.applicantId, pmbApplicants.id))
      .where(eq(pmbApplicantDocuments.fileUrl, filename));

    const doc = documents[0];

    // Authorization checks
    if (sessionUser.role === "candidate") {
      const isOwner = doc && (sessionUser.id === doc.applicantId || sessionUser.email === doc.email);
      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke berkas ini" }, { status: 403 });
      }
    } else {
      // Staff roles allowed to view: super_admin_pmb, verifikator_berkas, staff_keuangan
      const allowedRoles = ["super_admin_pmb", "verifikator_berkas", "staff_keuangan", "staff_marketing"];
      if (!allowedRoles.includes(sessionUser.role)) {
        return NextResponse.json({ error: "Forbidden: Peran Anda tidak memiliki akses" }, { status: 403 });
      }
    }

    // Return a mock valid PDF file that browsers can render inline
    const pdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Dokumen PMB Terverifikasi) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n307\n%%EOF"
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
