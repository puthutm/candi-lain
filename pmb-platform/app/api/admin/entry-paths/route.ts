import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbEntryPaths } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { requireRole, FULL_ACCESS_ROLES } from "@/lib/sso-middleware";

export async function GET() {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const paths = await db.select().from(pmbEntryPaths);
    return NextResponse.json({ success: true, entryPaths: paths });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { name, code, formFee, isFree } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: "name dan code wajib diisi" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbEntryPaths)
      .values({
        name,
        code: code.toUpperCase(),
        formFee: String(formFee || 0),
        isFree: !!isFree,
      })
      .returning();

    return NextResponse.json({ success: true, entryPath: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { id, name, code, formFee, isFree } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id wajib diisi" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (formFee !== undefined) updateData.formFee = String(formFee);
    if (isFree !== undefined) updateData.isFree = !!isFree;

    const [updated] = await db
      .update(pmbEntryPaths)
      .set(updateData)
      .where(eq(pmbEntryPaths.id, id))
      .returning();

    return NextResponse.json({ success: true, entryPath: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id wajib" }, { status: 400 });

    await db.delete(pmbEntryPaths).where(eq(pmbEntryPaths.id, id));
    return NextResponse.json({ success: true, message: "Jalur masuk berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
