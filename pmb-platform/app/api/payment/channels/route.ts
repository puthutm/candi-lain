/**
 * Payment Channels API
 *
 * Mendapatkan daftar metode pembayaran yang tersedia dari payment gateway aktif.
 * Endpoint: GET /api/payment/channels
 */

import { NextResponse } from "next/server";
import { getGatewayRegistry } from "@/lib/payment/gateway-registry";

export async function GET() {
  try {
    const registry = getGatewayRegistry();
    const channels = await registry.getPaymentChannels();

    return NextResponse.json({
      success: true,
      channels,
      activeGateway: registry.getActiveProvider().name,
      gatewayDisplayName: registry.getActiveProvider().displayName,
    });
  } catch (error: any) {
    console.error("Get payment channels error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
