import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helper";
import { ConsentService } from "@/lib/services/consent";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await ConsentService.getConsentHistory(user.id);
    return NextResponse.json({ history });
  } catch (err: any) {
    console.error("Failed to fetch consent history:", err);
    return NextResponse.json({ error: "Failed to fetch consent history" }, { status: 500 });
  }
}
