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
    { code: "PROVINSI", name: "Provinsi", description: "Daftar Provinsi di Indonesia" },
    { code: "KOTA", name: "Kota / Kabupaten", description: "Daftar Kota dan Kabupaten di Indonesia" },
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

  // 3. Seed Provinces and Cities dynamically
  console.log("Seeding Provinces and Cities...");
  const provinces = ["DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "Jawa Timur", "DI Yogyakarta"];
  const provIdMap = new Map<string, string>();

  const provCatId = catMap.get("PROVINSI");
  if (provCatId) {
    for (const provName of provinces) {
      const code = provName.toUpperCase().replace(/\s+/g, "_");
      const existing = await db
        .select()
        .from(refItems)
        .where(eq(refItems.code, code))
        .limit(1);

      let itemId: string | undefined = existing[0]?.id;
      if (existing.length === 0) {
        const insertedList = await db.insert(refItems).values({
          categoryId: provCatId,
          code,
          name: provName,
          sortOrder: 1,
          isActive: true,
        }).returning({ id: refItems.id });
        
        if (insertedList[0]) {
          itemId = insertedList[0].id;
          console.log(`Created Province: ${provName}`);
        }
      }
      if (itemId) {
        provIdMap.set(provName, itemId);
      }
    }
  }

  const citiesData: Record<string, string[]> = {
    "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
    "Jawa Barat": ["Bandung", "Bogor", "Depok", "Bekasi", "Cimahi", "Tasikmalaya", "Cirebon", "Sukabumi", "Garut"],
    "Banten": ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon", "Pandeglang", "Lebak"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Pekalongan", "Tegal", "Salatiga"],
    "Jawa Timur": ["Surabaya", "Malang", "Madiun", "Kediri", "Blitar", "Pasuruan", "Probolinggo", "Batu"],
    "DI Yogyakarta": ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"]
  };

  const kotaCatId = catMap.get("KOTA");
  if (kotaCatId) {
    for (const [provName, cities] of Object.entries(citiesData)) {
      const parentId = provIdMap.get(provName);
      if (!parentId) continue;

      for (const cityName of cities) {
        const code = cityName.toUpperCase().replace(/\s+/g, "_");
        const existing = await db
          .select()
          .from(refItems)
          .where(eq(refItems.code, code))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(refItems).values({
            categoryId: kotaCatId,
            parentId,
            code,
            name: cityName,
            sortOrder: 1,
            isActive: true,
          });
          console.log(`Created City: ${cityName} (Parent: ${provName})`);
        }
      }
    }
  }

  console.log("Seeding complete! Database successfully populated with PMB & Region lookup categories & items.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
