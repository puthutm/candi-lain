import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, poApprovals } from "@/db/schema/expenditure";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { poNumber, vendorName, category, amount, dueDate, description, requiresQuotation, quotationCount, createdBy } = body;

    if (!poNumber || !vendorName || !category || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [order] = await db.insert(purchaseOrders).values({
      poNumber,
      vendorName,
      category,
      amount: amount.toString(),
      dueDate: dueDate || null,
      description: description || null,
      requiresQuotation: requiresQuotation || false,
      quotationCount: quotationCount ? quotationCount.toString() : "0",
      createdBy: createdBy || null,
      status: "draf",
      currentStage: "kepala_biro",
    }).returning();

    // Create initial approval stage
    await db.insert(poApprovals).values({
      purchaseOrderId: order!.id,
      stage: "kepala_biro",
      approverRole: "kepala_biro",
      action: "pending",
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
