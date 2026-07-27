import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices } from "@/db/schema/invoices";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { gatewayRegistry } from "@/lib/payment/gateway-registry";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "invoiceId is required" }, { status: 400 });
    }

    // 2. Fetch invoice details
    const [invoice] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // Verify ownership
    if (invoice.studentUserId !== sessionUser.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: not your invoice" }, { status: 403 });
    }

    if (invoice.status === "lunas") {
      return NextResponse.json({ success: false, error: "Tagihan ini sudah lunas" }, { status: 400 });
    }

    // 3. Create payment transaction via gateway
    const amount = parseFloat(invoice.outstandingAmount);
    const customerDetails = {
      firstName: sessionUser.name || "Mahasiswa",
      lastName: "",
      email: sessionUser.email || "",
      phone: sessionUser.phone || "",
    };

    const transaction = await gatewayRegistry.getProvider().createTransaction({
      orderId: invoice.invoiceNumber,
      grossAmount: amount,
      customerDetails,
      itemDetails: [
        {
          id: invoice.id,
          name: `Tagihan ${invoice.invoiceType.toUpperCase()} - ${invoice.academicPeriodLabel}`,
          quantity: 1,
          price: amount,
        },
      ],
    });

    // 4. Return payment instructions
    return NextResponse.json({
      success: true,
      transaction: {
        token: transaction.token,
        redirectUrl: transaction.redirectUrl,
        transactionId: transaction.transactionId,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.outstandingAmount,
        dueDate: invoice.dueDate,
      },
      message: "Silakan selesaikan pembayaran melalui saluran yang dipilih",
    });

  } catch (error: any) {
    console.error("Payment API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
