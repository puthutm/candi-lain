import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";

let inMemorySettings = {
  institutionName: "Universitas Siber Asia",
  institutionShortName: "UNSIA",
  registrationFormat: "PMB{TAHUN}-{NO_URUT}",
  paymentDueDateDays: 7,
  paymentGateway: "manual",
  paymentMode: "sandbox",
  emailProvider: "smtp",
  waProvider: "fonnte",
  cbtDuration: 60,
  cbtPassScore: 60,
  cbtRetakePolicy: "once",
  cbtDetectTabSwitch: true,
  autoWelcomeEmail: true,
  autoPaymentReminder: true,
};

export async function GET() {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    const pmbUserCookie = cookieStore.get("pmb_user");
    const userRole = (session?.user as any)?.role || (pmbUserCookie ? JSON.parse(pmbUserCookie.value).role : null);

    const allowedRoles = ["admin", "superadmin", "super_admin", "admin_pmb", "super_admin_pmb", "verifikator_berkas", "staff_keuangan", "staff_marketing"];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, settings: inMemorySettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    const pmbUserCookie = cookieStore.get("pmb_user");
    const userRole = (session?.user as any)?.role || (pmbUserCookie ? JSON.parse(pmbUserCookie.value).role : null);

    const allowedRoles = ["admin", "superadmin", "super_admin", "admin_pmb", "super_admin_pmb"];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    inMemorySettings = { ...inMemorySettings, ...body };

    return NextResponse.json({ success: true, message: "Pengaturan sistem PMB berhasil diperbarui!", settings: inMemorySettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
