import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, employeeOnboarding } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    let sessionUser: any = null;
    if (sessionCookie) {
      try {
        sessionUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    let employee: any = null;
    if (sessionUser && sessionUser.userId) {
      const empList = await db
        .select()
        .from(employees)
        .where(eq(employees.ssoUserId, sessionUser.userId))
        .limit(1);
      employee = empList[0];
    }

    if (!employee) {
      const firstEmp = await db.select().from(employees).limit(1);
      employee = firstEmp[0] || null;
    }

    if (!employee) {
      return NextResponse.json({
        success: true,
        data: {
          nip: "0999",
          gelarDepan: "dr",
          gelarBelakang: "dr",
          tempatLahir: "jakarta",
          tanggalLahir: "",
          jenisKelamin: "Laki - laki",
          statusPernikahan: "Menikah",
          agama: "Islam",
          suku: "Betawi",
          beratBadan: "65",
          tinggiBadan: "170",
          golonganDarah: "",
          statusAkun: "Aktif",
          kewarganegaraan: "Indonesia",
          unitKerja: "Informatika",
          hubunganKerja: "Tetap",
          jenisPegawai: "Dosen",
          jabatanFungsional: "Lektor",
          noWa: "081122334455",
          ttdDigital: "",
          ttdBarcode: "",
          noAkunFinger: "",
          transportasi: "",
          ukuranJas: "L",
          pekerjaan: "",
          statusKaryawan: "Aktif",
          posisiAkademik: "",
          programStudi: "S1 PJJ Informatika",
          nidn: "0312087201",
          nupn: "",
          rumpunBidangIlmu: "Ilmu Komputer / Informatika",
          noPasport: "",
          idSinta: "",
          idScopus: "",
          idOrcid: "",
          tglSertifikasiDosen: "",
          noSertifikasi: "",
          fileSertifikasi: "",
          keluarga: [],
          provinsi: "DKI Jakarta",
          kabupaten: "Jakarta Selatan",
          kecamatan: "Beji",
          kelurahan: "Pondok Cina",
          kodePos: "16424",
          jarakRumah: "5",
          alamat: "Jl. Margonda Raya No. 100",
        },
        completenessPercent: 35,
      });
    }

    const onboardingList = await db
      .select()
      .from(employeeOnboarding)
      .where(eq(employeeOnboarding.employeeId, employee.id))
      .limit(1);

    let savedData: any = {};
    if (onboardingList[0] && onboardingList[0].checklistJson) {
      try {
        savedData = JSON.parse(onboardingList[0].checklistJson);
      } catch {}
    }

    const mergedData = {
      nip: employee.employeeNumber || savedData.nip || "0999",
      gelarDepan: savedData.gelarDepan || "",
      gelarBelakang: savedData.gelarBelakang || "",
      tempatLahir: savedData.tempatLahir || "Jakarta",
      tanggalLahir: savedData.tanggalLahir || "",
      jenisKelamin: savedData.jenisKelamin || "Laki - laki",
      statusPernikahan: savedData.statusPernikahan || "Menikah",
      agama: savedData.agama || "Islam",
      suku: savedData.suku || "",
      beratBadan: savedData.beratBadan || "",
      tinggiBadan: savedData.tinggiBadan || "",
      golonganDarah: savedData.golonganDarah || "",
      statusAkun: employee.status === "aktif" ? "Aktif" : "Nonaktif",
      kewarganegaraan: savedData.kewarganegaraan || "Indonesia",
      unitKerja: savedData.unitKerja || "Informatika",
      hubunganKerja: savedData.hubunganKerja || "Tetap",
      jenisPegawai: employee.employeeType === "dosen" ? "Dosen" : "Tendik",
      jabatanFungsional: savedData.jabatanFungsional || "",
      noWa: savedData.noWa || "081122334455",
      ttdDigital: savedData.ttdDigital || "",
      ttdBarcode: savedData.ttdBarcode || "",
      noAkunFinger: savedData.noAkunFinger || "",
      transportasi: savedData.transportasi || "",
      ukuranJas: savedData.ukuranJas || "",
      pekerjaan: savedData.pekerjaan || "",
      statusKaryawan: savedData.statusKaryawan || "Aktif",
      posisiAkademik: savedData.posisiAkademik || "",
      programStudi: savedData.programStudi || "S1 PJJ Informatika",
      nidn: employee.nidn || savedData.nidn || "",
      nupn: savedData.nupn || "",
      rumpunBidangIlmu: savedData.rumpunBidangIlmu || "",
      noPasport: savedData.noPasport || "",
      idSinta: savedData.idSinta || "",
      idScopus: savedData.idScopus || "",
      idOrcid: savedData.idOrcid || "",
      tglSertifikasiDosen: savedData.tglSertifikasiDosen || "",
      noSertifikasi: savedData.noSertifikasi || "",
      fileSertifikasi: savedData.fileSertifikasi || "",
      keluarga: savedData.keluarga || [],
      provinsi: savedData.provinsi || "DKI Jakarta",
      kabupaten: savedData.kabupaten || "Jakarta Selatan",
      kecamatan: savedData.kecamatan || "",
      kelurahan: savedData.kelurahan || "",
      kodePos: savedData.kodePos || "",
      jarakRumah: savedData.jarakRumah || "0",
      alamat: savedData.alamat || "",
    };

    return NextResponse.json({
      success: true,
      data: mergedData,
      completenessPercent: onboardingList[0]?.completenessPercent || 35,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    let sessionUser: any = null;
    if (sessionCookie) {
      try {
        sessionUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    let employee: any = null;
    if (sessionUser && sessionUser.userId) {
      const empList = await db
        .select()
        .from(employees)
        .where(eq(employees.ssoUserId, sessionUser.userId))
        .limit(1);
      employee = empList[0];
    }

    if (!employee) {
      const firstEmp = await db.select().from(employees).limit(1);
      employee = firstEmp[0] || null;
    }

    if (employee) {
      const existingOnboarding = await db
        .select()
        .from(employeeOnboarding)
        .where(eq(employeeOnboarding.employeeId, employee.id))
        .limit(1);

      let prevJson: any = {};
      if (existingOnboarding[0] && existingOnboarding[0].checklistJson) {
        try {
          prevJson = JSON.parse(existingOnboarding[0].checklistJson);
        } catch {}
      }

      const updatedJson = { ...prevJson, ...body };
      const updatedJsonStr = JSON.stringify(updatedJson);

      const keyFields = [
        "nip", "tempatLahir", "tanggalLahir", "jenisKelamin", "agama",
        "unitKerja", "noWa", "nidn", "provinsi", "kabupaten", "alamat"
      ];
      const filledCount = keyFields.filter(k => !!updatedJson[k]).length;
      const completenessPercent = Math.min(100, Math.round((filledCount / keyFields.length) * 100));

      if (existingOnboarding[0]) {
        await db
          .update(employeeOnboarding)
          .set({
            checklistJson: updatedJsonStr,
            completenessPercent,
            status: completenessPercent >= 80 ? "selesai" : "proses",
          })
          .where(eq(employeeOnboarding.id, existingOnboarding[0].id));
      } else {
        await db.insert(employeeOnboarding).values({
          employeeId: employee.id,
          completenessPercent,
          status: "proses",
          checklistJson: updatedJsonStr,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Biodata berhasil disimpan!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
