import { db } from "./index";
import { refCategories, refItems } from "./schema/reference";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Starting reference data seeding for PMB lookup items...");

  // 1. Define categories
  const categoriesList = [
    { code: "FAKULTAS", name: "Fakultas", description: "Daftar fakultas di lingkungan universitas" },
    { code: "JENJANG_PENDIDIKAN", name: "Jenjang Pendidikan", description: "Tingkat pendidikan / jenjang studi" },
    { code: "GENDER", name: "Jenis Kelamin", description: "Standar gender pendaftar" },
    { code: "METODE_PEMBAYARAN", name: "Metode Pembayaran", description: "Channel pembayaran transaksi keuangan" },
    { code: "DOKUMEN_PERSYARATAN", name: "Dokumen Persyaratan", description: "Jenis dokumen kelengkapan berkas PMB" },
  ];

  for (const cat of categoriesList) {
    const existing = await db
      .select()
      .from(refCategories)
      .where(eq(refCategories.code, cat.code))
      .limit(1);

    if (existing.length === 0) {
      console.log(`Creating category: ${cat.code}`);
      await db.insert(refCategories).values(cat);
    } else {
      console.log(`Category ${cat.code} already exists, skipping.`);
    }
  }

  // Reload categories to get IDs
  const dbCats = await db.select().from(refCategories);
  const catMap = new Map(dbCats.map((c) => [c.code, c.id]));

  // 2. Define items
  const itemsList = [
    // Fakultas
    { catCode: "FAKULTAS", code: "FT", name: "Fakultas Teknik", sortOrder: 1 },
    { catCode: "FAKULTAS", code: "FEB", name: "Fakultas Ekonomi dan Bisnis", sortOrder: 2 },
    { catCode: "FAKULTAS", code: "FISIP", name: "Fakultas Ilmu Sosial dan Politik", sortOrder: 3 },
    { catCode: "FAKULTAS", code: "FIB", name: "Fakultas Ilmu Budaya", sortOrder: 4 },

    // Jenjang
    { catCode: "JENJANG_PENDIDIKAN", code: "S1", name: "Sarjana (S1)", sortOrder: 1 },
    { catCode: "JENJANG_PENDIDIKAN", code: "S2", name: "Magister (S2)", sortOrder: 2 },
    { catCode: "JENJANG_PENDIDIKAN", code: "D3", name: "Diploma (D3)", sortOrder: 3 },

    // Gender
    { catCode: "GENDER", code: "L", name: "Laki-laki", sortOrder: 1 },
    { catCode: "GENDER", code: "P", name: "Perempuan", sortOrder: 2 },

    // Metode Pembayaran
    { catCode: "METODE_PEMBAYARAN", code: "VA_BCA", name: "Virtual Account BCA", sortOrder: 1 },
    { catCode: "METODE_PEMBAYARAN", code: "VA_MANDIRI", name: "Virtual Account Mandiri", sortOrder: 2 },
    { catCode: "METODE_PEMBAYARAN", code: "QRIS", name: "QRIS (Gopay/Dana/LinkAja)", sortOrder: 3 },
    { catCode: "METODE_PEMBAYARAN", code: "E_WALLET_OVO", name: "OVO E-Wallet", sortOrder: 4 },

    // Dokumen Persyaratan
    { catCode: "DOKUMEN_PERSYARATAN", code: "KTP", name: "Kartu Tanda Penduduk (KTP)", sortOrder: 1 },
    { catCode: "DOKUMEN_PERSYARATAN", code: "IJAZAH", name: "Ijazah SMA/SMK/MA Terakhir atau SKL", sortOrder: 2 },
    { catCode: "DOKUMEN_PERSYARATAN", code: "RAPOR", name: "Transkrip Rapor Semester 1 - 5", sortOrder: 3 },
    { catCode: "DOKUMEN_PERSYARATAN", code: "PAS_FOTO", name: "Pas Foto Berwarna Terbaru (3x4)", sortOrder: 4 },
  ];

  for (const item of itemsList) {
    const catId = catMap.get(item.catCode);
    if (!catId) continue;

    const existing = await db
      .select()
      .from(refItems)
      .where(eq(refItems.code, item.code))
      .limit(1); // Approximate check by item code globally

    if (existing.length === 0) {
      console.log(`Creating item: ${item.code} under category ${item.catCode}`);
      await db.insert(refItems).values({
        categoryId: catId,
        code: item.code,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      });
    } else {
      console.log(`Item ${item.code} already exists, skipping.`);
    }
  }

  console.log("Seeding complete! Database successfully populated with PMB lookup categories & items.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
