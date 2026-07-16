import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationUnits, positions } from "@/db/schema/organization";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// POST: Add or update organization unit or position
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { type, id, code, name, unitType, abbreviation, functionalAllowance, rankGroup } = await req.json();

    if (type === "unit") {
      if (!code || !name || !unitType) {
        return NextResponse.json({ success: false, error: "Kode, nama, dan tipe unit wajib diisi" }, { status: 400 });
      }

      if (id) {
        await db
          .update(organizationUnits)
          .set({ code, name, type: unitType })
          .where(eq(organizationUnits.id, id));
        return NextResponse.json({ success: true, message: "Unit organisasi berhasil diperbarui" });
      } else {
        await db.insert(organizationUnits).values({ code, name, type: unitType });
        return NextResponse.json({ success: true, message: "Unit organisasi baru berhasil ditambahkan" });
      }
    }

    if (type === "position") {
      if (!name || !abbreviation) {
        return NextResponse.json({ success: false, error: "Nama dan singkatan jabatan wajib diisi" }, { status: 400 });
      }

      const allowance = functionalAllowance ? Number(functionalAllowance) : 0;

      if (id) {
        await db
          .update(positions)
          .set({ name, abbreviation, functionalAllowance: allowance, rankGroup: rankGroup || "III/a" })
          .where(eq(positions.id, id));
        return NextResponse.json({ success: true, message: "Jabatan berhasil diperbarui" });
      } else {
        await db.insert(positions).values({ name, abbreviation, functionalAllowance: allowance, rankGroup: rankGroup || "III/a", isActive: true });
        return NextResponse.json({ success: true, message: "Jabatan baru berhasil ditambahkan" });
      }
    }

    return NextResponse.json({ success: false, error: "Tipe operasi tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
