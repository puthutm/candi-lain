import { NextResponse, type NextRequest } from "next/server";

const FALLBACK_REFERENCES: Record<string, Array<{ code: string; name: string }>> = {
  GENDER: [
    { code: "Male", name: "Male" },
    { code: "Female", name: "Female" },
  ],
  AGAMA: [
    { code: "Islam", name: "Islam" },
    { code: "Kristen", name: "Kristen" },
    { code: "Katolik", name: "Katolik" },
    { code: "Hindu", name: "Hindu" },
    { code: "Buddha", name: "Buddha" },
    { code: "Khonghucu", name: "Khonghucu" },
  ],
  SUKU: [
    { code: "Jawa", name: "Jawa" },
    { code: "Sunda", name: "Sunda" },
    { code: "Betawi", name: "Betawi" },
    { code: "Batak", name: "Batak" },
    { code: "Minangkabau", name: "Minangkabau" },
    { code: "Bugis", name: "Bugis" },
    { code: "Aceh", name: "Aceh" },
    { code: "Papua", name: "Papua" },
  ],
  PEKERJAAN: [
    { code: "Mahasiswa", name: "Mahasiswa" },
    { code: "Karyawan Swasta", name: "Karyawan Swasta" },
    { code: "Wiraswasta", name: "Wiraswasta" },
    { code: "Pegawai Negeri Sipil (PNS)", name: "Pegawai Negeri Sipil (PNS)" },
    { code: "TNI / Polri", name: "TNI / Polri" },
    { code: "Ibu Rumah Tangga", name: "Ibu Rumah Tangga" },
    { code: "Tidak Bekerja", name: "Tidak Bekerja" },
  ],
  JALUR_MASUK: [
    { code: "Reguler", name: "Reguler" },
    { code: "Beasiswa", name: "Beasiswa" },
    { code: "RPL / Transfer", name: "RPL / Transfer" },
  ],
  UKURAN_JAS: [
    { code: "S", name: "S" },
    { code: "M", name: "M" },
    { code: "L", name: "L" },
    { code: "XL", name: "XL" },
    { code: "XXL", name: "XXL" },
  ],
  JENIS_HUBUNGAN_KELUARGA: [
    { code: "Ayah Kandung", name: "Ayah Kandung" },
    { code: "Ibu Kandung", name: "Ibu Kandung" },
    { code: "Suami", name: "Suami" },
    { code: "Istri", name: "Istri" },
    { code: "Anak", name: "Anak" },
    { code: "Wali", name: "Wali" },
    { code: "Kakak", name: "Kakak" },
    { code: "Adik", name: "Adik" },
  ],
  STATUS_HUBUNGAN_KELUARGA: [
    { code: "Kepala Keluarga", name: "Kepala Keluarga" },
    { code: "Suami", name: "Suami" },
    { code: "Istri", name: "Istri" },
    { code: "Anak", name: "Anak" },
    { code: "Tanggungan", name: "Tanggungan" },
  ],
  STATUS_HIDUP: [
    { code: "Hidup", name: "Hidup" },
    { code: "Meninggal", name: "Meninggal" },
  ],
  TEMPAT_LAHIR: [
    { code: "banda aceh", name: "banda aceh" },
    { code: "jakarta", name: "jakarta" },
    { code: "surabaya", name: "surabaya" },
    { code: "medan", name: "medan" },
    { code: "bandung", name: "bandung" },
    { code: "semarang", name: "semarang" },
  ],
  JENJANG_PENDIDIKAN: [
    { code: "SD", name: "SD / Sederajat" },
    { code: "SMP", name: "SMP / Sederajat" },
    { code: "SMA/SMK", name: "SMA / SMK / MA" },
    { code: "Diploma", name: "Diploma (D3/D4)" },
    { code: "Sarjana", name: "Sarjana (S1)" },
    { code: "Magister", name: "Magister (S2)" },
  ],
  PRODI: [
    { code: "S1_INF", name: "S1 Informatika" },
    { code: "S1_SI", name: "S1 Sistem Informasi" },
    { code: "S1_MNJ", name: "S1 Manajemen" },
    { code: "S1_AKT", name: "S1 Akuntansi" },
    { code: "S1_KOM", name: "S1 Komunikasi" },
  ],
  SEMESTER: [
    { code: "SEM_1", name: "Semester 1" },
    { code: "SEM_2", name: "Semester 2" },
    { code: "SEM_3", name: "Semester 3" },
    { code: "SEM_4", name: "Semester 4" },
    { code: "SEM_5", name: "Semester 5" },
    { code: "SEM_6", name: "Semester 6" },
    { code: "SEM_7", name: "Semester 7" },
    { code: "SEM_8", name: "Semester 8" },
  ],
  PROVINSI: [
    { code: "DKI Jakarta", name: "DKI Jakarta" },
    { code: "Jawa Barat", name: "Jawa Barat" },
    { code: "Banten", name: "Banten" },
    { code: "Jawa Tengah", name: "Jawa Tengah" },
    { code: "Jawa Timur", name: "Jawa Timur" },
    { code: "DI Yogyakarta", name: "DI Yogyakarta" },
  ],
  KOTA: [
    { code: "Jakarta Timur", name: "Jakarta Timur" },
    { code: "Jakarta Selatan", name: "Jakarta Selatan" },
    { code: "Jakarta Pusat", name: "Jakarta Pusat" },
    { code: "Bandung", name: "Bandung" },
    { code: "Surabaya", name: "Surabaya" },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  const { categoryCode } = await params;
  const upperCode = categoryCode.toUpperCase();

  const referenceServiceUrl = process.env.REFERENCE_DATA_URL || "http://reference-data:3001";
  try {
    const res = await fetch(`${referenceServiceUrl}/api/reference/${upperCode}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return NextResponse.json({ success: true, items: data.items });
      }
    }
  } catch (err) {
    console.warn(`Reference service request failed for ${upperCode}, using fallback items.`);
  }

  // Fallback to pre-defined reference data
  const fallback = FALLBACK_REFERENCES[upperCode] || [];
  return NextResponse.json({ success: true, items: fallback, source: "fallback" });
}

export const dynamic = "force-dynamic";
