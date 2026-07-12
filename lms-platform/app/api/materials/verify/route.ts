import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsMaterials } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { materialId, tahap, keputusan, catatan, verifierId } = body;

    if (!materialId || !tahap || !keputusan || !verifierId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    if (tahap !== "prodi" && tahap !== "bpm") {
      return NextResponse.json({ success: false, error: "Tahap verifikasi tidak valid" }, { status: 400 });
    }

    if (keputusan !== "setuju" && keputusan !== "revisi") {
      return NextResponse.json({ success: false, error: "Keputusan verifikasi tidak valid" }, { status: 400 });
    }

    if (keputusan === "revisi" && (!catatan || catatan.trim() === "")) {
      return NextResponse.json({ success: false, error: "Catatan revisi wajib diisi" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Find material
      const materialList = await tx
        .select()
        .from(lmsMaterials)
        .where(eq(lmsMaterials.id, materialId))
        .limit(1)
        .for("update");

      if (materialList.length === 0) {
        throw new Error("Materi ajar tidak ditemukan");
      }
      const material = materialList[0]!;

      if (tahap === "prodi") {
        if (material.verificationStatus !== "menunggu_prodi") {
          throw new Error("Materi tidak dalam antrean verifikasi Prodi");
        }

        if (keputusan === "setuju") {
          await tx
            .update(lmsMaterials)
            .set({
              verificationStatus: "menunggu_bpm",
              verifiedByProdiUserId: verifierId,
              verifiedByProdiAt: new Date(),
              revisionNote: null,
            })
            .where(eq(lmsMaterials.id, materialId));
        } else {
          await tx
            .update(lmsMaterials)
            .set({
              verificationStatus: "revisi",
              revisionNote: catatan.trim(),
            })
            .where(eq(lmsMaterials.id, materialId));
        }
      } else {
        // bpm stage
        if (material.verificationStatus !== "menunggu_bpm") {
          throw new Error("Materi belum disetujui oleh Prodi / tidak menunggu BPM");
        }

        if (keputusan === "setuju") {
          await tx
            .update(lmsMaterials)
            .set({
              verificationStatus: "terbit",
              verifiedByBpmUserId: verifierId,
              verifiedByBpmAt: new Date(),
              revisionNote: null,
            })
            .where(eq(lmsMaterials.id, materialId));
        } else {
          await tx
            .update(lmsMaterials)
            .set({
              verificationStatus: "revisi",
              revisionNote: catatan.trim(),
            })
            .where(eq(lmsMaterials.id, materialId));
        }
      }

      return { materialId, status: keputusan === "setuju" ? (tahap === "prodi" ? "menunggu_bpm" : "terbit") : "revisi" };
    });

    return NextResponse.json({
      success: true,
      message: `Materi berhasil diproses! Status saat ini: ${result.status}`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
