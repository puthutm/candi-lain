import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "invoiceId is required" }, { status: 400 });
    }

    // 1. Fetch invoice details
    const [invoice] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "lunas") {
      return NextResponse.json({ success: false, error: "Tagihan ini sudah lunas" }, { status: 400 });
    }

    // 2. Call the payment webhook dynamically to simulate payment success
    const host = request.headers.get("host") || "localhost:3005";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const webhookUrl = `${protocol}://${host}/api/webhooks/payment`;

    const webhookBody = {
      order_id: invoice.invoiceNumber,
      transaction_status: "settlement",
      payment_type: "bank_transfer",
      gross_amount: invoice.outstandingAmount,
      transaction_id: `mock-trx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    console.log(`Triggering payment webhook at: ${webhookUrl}`);
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody),
    });

    const webhookData = await webhookRes.json();
    if (!webhookRes.ok || !webhookData.success) {
      return NextResponse.json({ 
        success: false, 
        error: webhookData.error || "Gagal memproses pembayaran melalui webhook internal" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pembayaran tagihan disimulasikan berhasil!" 
    });

  } catch (error: any) {
    console.error("Mock payment API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
