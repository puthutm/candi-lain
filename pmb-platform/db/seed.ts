import { db } from "@/db";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { pmbApplicants, pmbDocumentTypes, pmbApplicantProfiles, pmbApplicantDocuments } from "@/db/schema/applicants";

export async function ensurePmbSeeded() {
  try {
    // 1. Seed Waves
    const wavesCount = await db.select().from(pmbWaves);
    let gel1Id = "";
    if (wavesCount.length === 0) {
      const insertedWaves = await db.insert(pmbWaves).values([
        { name: "Gelombang 1 Ganjil", code: "GEL1-2026", startDate: "2025-10-01", endDate: "2026-06-30", status: "aktif" },
        { name: "Gelombang 2 Ganjil", code: "GEL2-2026", startDate: "2026-07-01", endDate: "2026-08-31", status: "belum_dibuka" }
      ]).returning();
      gel1Id = insertedWaves[0]?.id || "";
    } else {
      gel1Id = wavesCount.find(w => w.code === "GEL1-2026")?.id || "";
    }

    // 2. Seed Entry Paths
    const pathsCount = await db.select().from(pmbEntryPaths);
    if (pathsCount.length === 0) {
      await db.insert(pmbEntryPaths).values([
        { name: "Reguler", code: "REG", formFee: "250000.00", isFree: false },
        { name: "Jalur Prestasi", code: "PRES", formFee: "150000.00", isFree: false },
        { name: "Jalur Beasiswa", code: "BEAS", formFee: "0.00", isFree: true }
      ]);
    }

    // 3. Seed Study Programs
    const prodisCount = await db.select().from(pmbStudyPrograms);
    let infId = "";
    let siId = "";
    let manId = "";
    let aktId = "";
    if (prodisCount.length === 0) {
      const insertedProdis = await db.insert(pmbStudyPrograms).values([
        { name: "S1 Informatika", code: "INF", faculty: "FTI", degreeLevel: "S1" },
        { name: "S1 Sistem Informasi", code: "SI", faculty: "FTI", degreeLevel: "S1" },
        { name: "S1 Manajemen", code: "MAN", faculty: "FEB", degreeLevel: "S1" },
        { name: "S1 Akuntansi", code: "AKT", faculty: "FEB", degreeLevel: "S1" }
      ]).returning();
      infId = insertedProdis[0]?.id || "";
      siId = insertedProdis[1]?.id || "";
      manId = insertedProdis[2]?.id || "";
      aktId = insertedProdis[3]?.id || "";
    } else {
      infId = prodisCount.find(p => p.code === "INF")?.id || "";
      siId = prodisCount.find(p => p.code === "SI")?.id || "";
      manId = prodisCount.find(p => p.code === "MAN")?.id || "";
      aktId = prodisCount.find(p => p.code === "AKT")?.id || "";
    }

    // 4. Seed Quotas
    const quotasCount = await db.select().from(pmbQuotas);
    if (quotasCount.length === 0 && gel1Id && infId) {
      await db.insert(pmbQuotas).values([
        { waveId: gel1Id, studyProgramId: infId, quotaTotal: 120, quotaFilled: 45 },
        { waveId: gel1Id, studyProgramId: siId, quotaTotal: 100, quotaFilled: 30 },
        { waveId: gel1Id, studyProgramId: manId, quotaTotal: 150, quotaFilled: 60 },
        { waveId: gel1Id, studyProgramId: aktId, quotaTotal: 150, quotaFilled: 50 }
      ]);
    }

    // 5. Seed Document Types
    const docsCount = await db.select().from(pmbDocumentTypes);
    let ktpTypeId = "";
    let ijazahTypeId = "";
    let kkTypeId = "";
    let fotoTypeId = "";

    if (docsCount.length === 0) {
      const insertedDocs = await db.insert(pmbDocumentTypes).values([
        { name: "Kartu Tanda Penduduk (KTP)", code: "KTP", isRequired: true },
        { name: "Ijazah Terakhir / SKL", code: "IJAZAH", isRequired: true },
        { name: "Kartu Keluarga (KK)", code: "KK", isRequired: true },
        { name: "Pas Foto 3x4 (Background Merah)", code: "FOTO", isRequired: true }
      ]).returning();
      ktpTypeId = insertedDocs.find(d => d.code === "KTP")?.id || "";
      ijazahTypeId = insertedDocs.find(d => d.code === "IJAZAH")?.id || "";
      kkTypeId = insertedDocs.find(d => d.code === "KK")?.id || "";
      fotoTypeId = insertedDocs.find(d => d.code === "FOTO")?.id || "";
    } else {
      ktpTypeId = docsCount.find(d => d.code === "KTP")?.id || "";
      ijazahTypeId = docsCount.find(d => d.code === "IJAZAH")?.id || "";
      kkTypeId = docsCount.find(d => d.code === "KK")?.id || "";
      fotoTypeId = docsCount.find(d => d.code === "FOTO")?.id || "";
    }

    // 6. Seed Applicants
    const applicantsCount = await db.select().from(pmbApplicants);
    if (applicantsCount.length === 0 && gel1Id && infId) {
      const paths = await db.select().from(pmbEntryPaths);
      const regId = paths.find(p => p.code === "REG")?.id || "";
      const beasId = paths.find(p => p.code === "BEAS")?.id || "";

      // Insert applicants
      const budi = await db.insert(pmbApplicants).values({
        registrationNumber: "PMB26-09812",
        fullName: "Budi Santoso",
        email: "budi.santoso@example.com",
        phone: "08123456789",
        passwordHash: "placeholder_hash",
        waveId: gel1Id,
        entryPathId: regId,
        studyProgramId: infId,
        currentStage: "unggah_berkas",
        paymentStatus: "lunas",
      }).returning();

      const andi = await db.insert(pmbApplicants).values({
        registrationNumber: "PMB26-09943",
        fullName: "Andi Pratama Wijaya",
        email: "andi.pratama@example.com",
        phone: "08234567890",
        passwordHash: "placeholder_hash",
        waveId: gel1Id,
        entryPathId: regId,
        studyProgramId: siId,
        currentStage: "siap_ujian",
        paymentStatus: "lunas",
      }).returning();

      const citra = await db.insert(pmbApplicants).values({
        registrationNumber: "PMB26-10021",
        fullName: "Citra Lestari",
        email: "citra.lestari@example.com",
        phone: "08345678901",
        passwordHash: "placeholder_hash",
        waveId: gel1Id,
        entryPathId: beasId,
        studyProgramId: manId,
        currentStage: "pendaftar",
        paymentStatus: "belum_bayar",
      }).returning();

      const dedi = await db.insert(pmbApplicants).values({
        registrationNumber: "PMB26-10254",
        fullName: "Dedi Kurniawan",
        email: "dedi.k@example.com",
        phone: "08456789012",
        passwordHash: "placeholder_hash",
        waveId: gel1Id,
        entryPathId: regId,
        studyProgramId: aktId,
        currentStage: "selesai_ujian",
        paymentStatus: "lunas",
      }).returning();

      const budiId = budi[0]!.id;
      const andiId = andi[0]!.id;
      const citraId = citra[0]!.id;
      const dediId = dedi[0]!.id;

      // Seed profiles
      await db.insert(pmbApplicantProfiles).values([
        { applicantId: budiId, nik: "3171010101010001", birthPlace: "Jakarta", birthDate: "2007-05-15", gender: "L", address: "Jl. Merdeka No. 10", parentName: "Joko Santoso" },
        { applicantId: andiId, nik: "3171010101010002", birthPlace: "Bandung", birthDate: "2007-08-20", gender: "L", address: "Jl. Dago No. 42", parentName: "Bambang Wijaya" },
        { applicantId: citraId, nik: "3171010101010003", birthPlace: "Surabaya", birthDate: "2007-11-12", gender: "P", address: "Jl. Sudirman No. 5", parentName: "Hendra Lestari" },
        { applicantId: dediId, nik: "3171010101010004", birthPlace: "Yogyakarta", birthDate: "2007-02-28", gender: "L", address: "Jl. Malioboro No. 100", parentName: "Supardi" },
      ]);

      // Seed documents
      if (ktpTypeId && ijazahTypeId && kkTypeId && fotoTypeId) {
        // Budi
        await db.insert(pmbApplicantDocuments).values([
          { applicantId: budiId, documentTypeId: ktpTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "menunggu_verifikasi" },
          { applicantId: budiId, documentTypeId: ijazahTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "menunggu_verifikasi" },
          { applicantId: budiId, documentTypeId: kkTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "menunggu_verifikasi" },
          { applicantId: budiId, documentTypeId: fotoTypeId, fileUrl: "https://ui-avatars.com/api/?name=Budi+Santoso&size=200", status: "menunggu_verifikasi" },
        ]);

        // Andi
        await db.insert(pmbApplicantDocuments).values([
          { applicantId: andiId, documentTypeId: ktpTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: andiId, documentTypeId: ijazahTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: andiId, documentTypeId: kkTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: andiId, documentTypeId: fotoTypeId, fileUrl: "https://ui-avatars.com/api/?name=Andi+Pratama&size=200", status: "terverifikasi" },
        ]);

        // Dedi
        await db.insert(pmbApplicantDocuments).values([
          { applicantId: dediId, documentTypeId: ktpTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: dediId, documentTypeId: ijazahTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: dediId, documentTypeId: kkTypeId, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", status: "terverifikasi" },
          { applicantId: dediId, documentTypeId: fotoTypeId, fileUrl: "https://ui-avatars.com/api/?name=Dedi+Kurniawan&size=200", status: "terverifikasi" },
        ]);
      }
    }
  } catch (error) {
    console.error("Error seeding PMB Database:", error);
  }
}
