import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems, payments } from "@/db/schema/invoices";
import { eq } from "drizzle-orm";

// GET: Generate E-Kuitansi PDF / Official Printable Receipt for SKEUM
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await params;

    const [invoiceRecord] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.id, invoiceId))
      .limit(1);

    if (!invoiceRecord) {
      return NextResponse.json({ success: false, error: "Invoice tagihan tidak ditemukan" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(studentInvoiceItems)
      .where(eq(studentInvoiceItems.invoiceId, invoiceId));

    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .limit(1);

    const receiptNumber = `KWI-UNSIA-${new Date().getFullYear()}-${invoiceRecord.invoiceNumber.slice(-6)}`;
    const verificationHash = Buffer.from(
      `UNSIA-FINANCE-${receiptNumber}-${invoiceRecord.studentUserId}-${invoiceRecord.totalAmount}`
    ).toString("base64");

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kuitansi Resmi Pembayaran UKT UNSIA - ${receiptNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 12px; margin-bottom: 25px; }
    .header h1 { margin: 0; font-size: 20px; color: #1e3a8a; text-transform: uppercase; }
    .header p { margin: 3px 0; font-size: 11px; color: #64748b; }
    .watermark { position: absolute; top: 35%; left: 25%; font-size: 80px; color: rgba(34, 197, 94, 0.08); font-weight: 900; transform: rotate(-30deg); pointer-events: none; z-index: -1; }
    .badge { display: inline-block; padding: 5px 14px; background-color: #dcfce7; color: #15803d; font-weight: bold; border-radius: 15px; font-size: 13px; margin: 10px 0; }
    .table-detail { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    .table-detail th { background-color: #f1f5f9; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    .table-detail td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .table-detail td.amount { text-align: right; font-family: monospace; font-weight: bold; }
    .total-box { font-size: 16px; font-weight: 900; color: #15803d; text-align: right; margin-top: 15px; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; }
    .qr-box { border: 1px dashed #94a3b8; padding: 8px 14px; text-align: center; border-radius: 8px; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="watermark">LUNAS / PAID</div>

  <div class="header">
    <h1>UNIVERSITAS SIBER ASIA</h1>
    <p>BIRO KEUANGAN DAN PERENCANAAN OPERASIONAL (SKEU / SKEUM)</p>
    <p>Jl. Harsono RM No. 1, Ragunan, Pasar Minggu, Jakarta Selatan | Website: keuangan.unsia.ac.id</p>
  </div>

  <div style="text-align: center;">
    <h3 style="margin: 0; font-size: 16px;">KUITANSI RESMI PEMBAYARAN MAHASISWA</h3>
    <p style="font-size: 11px; color: #64748b; margin-top: 2px;">Nomor Kuitansi: <strong>${receiptNumber}</strong></p>
    <div class="badge">STATUS: LUNAS (PAID)</div>
  </div>

  <table style="width: 100%; font-size: 12px; margin-top: 15px;">
    <tr>
      <td style="width: 20%; font-weight: bold; color: #475569;">Sudah Terima Dari:</td>
      <td style="font-weight: bold;">Mahasiswa ID: ${invoiceRecord.studentUserId}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #475569;">Periode / Semester:</td>
      <td>${invoiceRecord.academicPeriodLabel}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #475569;">Tanggal Lunas:</td>
      <td>${paymentRecord?.paidAt ? new Date(paymentRecord.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID")}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #475569;">Metode Pembayaran:</td>
      <td>${paymentRecord?.channel || "Bank Virtual Account (Midtrans)"}</td>
    </tr>
  </table>

  <table class="table-detail">
    <thead>
      <tr>
        <th>No</th>
        <th>Deskripsi Rincian Biaya</th>
        <th style="text-align: right;">Nominal (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${items.length > 0 ? items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.componentName}</td>
          <td class="amount">Rp ${Number(item.amount).toLocaleString("id-ID")}</td>
        </tr>
      `).join("") : `
        <tr>
          <td>1</td>
          <td>Biaya SPP / UKT Periode ${invoiceRecord.academicPeriodLabel}</td>
          <td class="amount">Rp ${Number(invoiceRecord.totalAmount).toLocaleString("id-ID")}</td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="total-box">
    <span>TOTAL DIBAYARKAN: Rp ${Number(invoiceRecord.totalAmount).toLocaleString("id-ID")}</span>
  </div>

  <div class="footer">
    <div class="qr-box">
      <p style="margin: 0; font-weight: bold; color: #0f172a;">KEABSAHAN DIGITAL BIRO KEUANGAN</p>
      <p style="margin: 3px 0; font-family: monospace; font-size: 10px;">HASH: ${verificationHash.slice(0, 18)}...</p>
      <p style="margin: 0; color: #16a34a;">✓ Diterbitkan Resmi oleh SKEUM UNSIA</p>
    </div>
    <div style="text-align: center;">
      <p>Jakarta, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p style="font-weight: bold; margin-top: 35px;">Kepala Biro Keuangan UNSIA</p>
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
