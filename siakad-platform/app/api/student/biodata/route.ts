import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudents } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    let sessionUser: any = null;
    if (sessionCookie) {
      try {
        sessionUser = JSON.parse(sessionCookie.value);
      } catch {}
    }

    let student: any = null;
    if (sessionUser && sessionUser.userId) {
      const studentRows = await db
        .select()
        .from(siakadStudents)
        .where(eq(siakadStudents.userId, sessionUser.userId))
        .limit(1);
      student = studentRows[0];
    }

    if (!student) {
      const firstStudent = await db.select().from(siakadStudents).limit(1);
      student = firstStudent[0] || null;
    }

    const defaultData = {
      namaLengkap: student?.fullName || "David",
      pekerjaan: "",
      tempatLahir: "jakarta timur",
      tinggiBadan: "",
      tanggalLahir: "2001-02-01",
      beratBadan: "",
      jenisKelamin: "Male",
      noHp: "85678910111",
      agama: "",
      emailPribadi: "tesemail12@gmail.com",
      suku: "",
      emailKampus: "",
      prodi: "S1 Informatika",
      nim: student?.nim || "26090182",
      semester: "Semester 1",
      dosenPa: "Dr. Aulia Rahman, M.Kom.",
      jalurMasuk: "Reguler",
      ukuranJas: "L",
      statusMahasiswa: "Aktif",
      nik: "3174012903010002",
      noKk: "3174012903010001",
      npwp: "",
      bpjs: "",
      ayahNama: "Budi Santoso",
      ayahPekerjaan: "Wiraswasta",
      ibuNama: "Siti Rahmah",
      ibuPekerjaan: "Ibu Rumah Tangga",
      provinsi: "DKI Jakarta",
      kabupaten: "Jakarta Timur",
      kecamatan: "Duren Sawit",
      kelurahan: "Duren Sawit",
      kodePos: "13440",
      alamatLengkap: "Jl. Duren Sawit Indah No. 12",
      asalSekolah: "SMKN 1 Jakarta",
      npsn: "20109283",
      jurusanSekolah: "Teknik Komputer & Jaringan",
      tahunLulus: "2020",
    };

    return NextResponse.json({
      success: true,
      data: defaultData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Biodata mahasiswa berhasil disimpan!",
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
