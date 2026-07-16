import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates } from "@/db/schema/schema";
import { siakadStudyPrograms } from "@/db/schema/siakad";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { csvText } = await req.json();
    if (!csvText) {
      return NextResponse.json({ success: false, error: "csvText is required" }, { status: 400 });
    }

    const lines = csvText.split("\n").filter((l: string) => l.trim() !== "");
    const progs = await db.select().from(siakadStudyPrograms);

    let count = 0;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const parts = line.split(",").map((p: string) => p.trim());
      if (parts.length < 4) continue;

      const [progName, sppText, bopText, period] = parts;
      if (!progName || !sppText || !bopText || !period) continue;

      const spp = parseFloat(sppText);
      const bop = parseFloat(bopText);
      const total = spp + bop;

      // Find matching prodi from cache
      let matchedProg = progs.find(p => p.name.toLowerCase() === progName.toLowerCase());
      
      let studyProgramRef = matchedProg?.id;
      if (!studyProgramRef) {
        // If not found in cache, generate a random one to map it
        studyProgramRef = "00000000-0000-0000-0000-000000000000";
      }

      await db.insert(tuitionRates).values({
        studyProgramRef,
        studyProgramNameSnapshot: progName,
        academicPeriodLabel: period,
        sppAmount: spp.toFixed(2),
        bopAmount: bop.toFixed(2),
        totalAmount: total.toFixed(2),
        requiresYayasanApproval: false,
      });

      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
