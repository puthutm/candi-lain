import { NextResponse } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { SettingsService } from "@/lib/settings-service";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const settings = SettingsService.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { institutionName, institutionShortName, portalName, sessionLifetime, allowSelfRegistration, mfaPolicy } = body;

    const success = SettingsService.saveSettings({
      institutionName,
      institutionShortName,
      portalName,
      sessionLifetime: Number(sessionLifetime) || 3600,
      allowSelfRegistration: Boolean(allowSelfRegistration),
      mfaPolicy,
    });

    if (!success) {
      throw new Error("Gagal menyimpan konfigurasi.");
    }

    // Write audit log
    await db.insert(auditLogs).values({
      actorUserId: sessionUser.id,
      entityType: "system_settings",
      entityId: "global",
      action: "update_settings",
    });

    return NextResponse.json({ success: true, message: "Pengaturan SSO berhasil diperbarui!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
