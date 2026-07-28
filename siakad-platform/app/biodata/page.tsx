"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StudentTab =
  | "biodata"
  | "informasi"
  | "kelengkapan"
  | "keluarga"
  | "alamat"
  | "pendidikan";

interface FamilyMemberItem {
  id: string;
  jenisHubunganKeluarga: string;
  namaAnggotaKeluarga: string;
  nikAnggotaKeluarga: string;
  statusHubunganKeluarga: string;
  tempatLahirKeluarga: string;
  tanggalLahirKeluarga: string;
  noHpKeluarga: string;
  emailKeluarga: string;
  alamatKeluarga: string;
  statusHidupKeluarga: string;
}

interface EducationItem {
  id: string;
  jenjang: string;
  namaInstitusi: string;
  npsn: string;
  jurusan: string;
  tahunMasuk: string;
  tahunLulus: string;
  nilaiAkhir: string;
}

export default function StudentBiodataPage() {
  const [activeTab, setActiveTab] = useState<StudentTab>("biodata");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [form, setForm] = useState({
    // 1. BIODATA
    namaLengkap: "David",
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

    // 2. INFORMASI
    prodi: "S1 Informatika",
    nim: "26090182",
    semester: "Semester 1",
    dosenPa: "Dr. Aulia Rahman, M.Kom.",
    jalurMasuk: "Reguler",
    ukuranJas: "L",
    statusMahasiswa: "Aktif",

    // 3. KELENGKAPAN
    nik: "1231234564567890",
    noKk: "",
    noPassport: "",
    nisn: "",
    npsn: "",
    tahunLulus: "2024",
    alamatKelengkapan: "",

    // 4. KELUARGA (Multi-Entry)
    riwayatKeluarga: [
      {
        id: "fam-1",
        jenisHubunganKeluarga: "Ayah Kandung",
        namaAnggotaKeluarga: "Budi Santoso",
        nikAnggotaKeluarga: "1111111111111111",
        statusHubunganKeluarga: "Kepala Keluarga",
        tempatLahirKeluarga: "banda aceh",
        tanggalLahirKeluarga: "1975-05-12",
        noHpKeluarga: "081234567890",
        emailKeluarga: "budi.santoso@gmail.com",
        alamatKeluarga: "Jl. Duren Sawit Indah No. 12, Jakarta Timur",
        statusHidupKeluarga: "Hidup",
      },
      {
        id: "fam-2",
        jenisHubunganKeluarga: "Ibu Kandung",
        namaAnggotaKeluarga: "Siti Rahmah",
        nikAnggotaKeluarga: "1111111111112222",
        statusHubunganKeluarga: "Istri",
        tempatLahirKeluarga: "jakarta",
        tanggalLahirKeluarga: "1978-08-20",
        noHpKeluarga: "081298765432",
        emailKeluarga: "siti.rahmah@gmail.com",
        alamatKeluarga: "Jl. Duren Sawit Indah No. 12, Jakarta Timur",
        statusHidupKeluarga: "Hidup",
      },
    ] as FamilyMemberItem[],
    jenisHubunganKeluarga: "",
    namaAnggotaKeluarga: "keluuarga cemara",
    nikAnggotaKeluarga: "1111111111111111",
    statusHubunganKeluarga: "",
    tempatLahirKeluarga: "banda aceh",
    tanggalLahirKeluarga: "",
    noHpKeluarga: "",
    emailKeluarga: "",
    alamatKeluarga: "",
    statusHidupKeluarga: "",
    ayahNama: "Budi Santoso",
    ayahPekerjaan: "Wiraswasta",
    ibuNama: "Siti Rahmah",
    ibuPekerjaan: "Ibu Rumah Tangga",

    // 5. ALAMAT
    provinsi: "DKI Jakarta",
    kabupaten: "Jakarta Timur",
    kecamatan: "Duren Sawit",
    kelurahan: "Duren Sawit",
    kodePos: "13440",
    alamatLengkap: "Jl. Duren Sawit Indah No. 12",

    // 6. PENDIDIKAN (Multi-Entry)
    riwayatPendidikan: [
      {
        id: "edu-1",
        jenjang: "SMA/SMK",
        namaInstitusi: "SMKN 1 Jakarta",
        npsn: "20109283",
        jurusan: "Teknik Komputer & Jaringan",
        tahunMasuk: "2017",
        tahunLulus: "2020",
        nilaiAkhir: "88.50",
      },
      {
        id: "edu-2",
        jenjang: "SMP",
        namaInstitusi: "SMPN 4 Jakarta",
        npsn: "20101122",
        jurusan: "Umum",
        tahunMasuk: "2014",
        tahunLulus: "2017",
        nilaiAkhir: "85.00",
      },
    ] as EducationItem[],
    asalSekolah: "SMKN 1 Jakarta",
    npsn: "20109283",
    jurusanSekolah: "Teknik Komputer & Jaringan",
    tahunLulus: "2020",
  });

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetch("/api/student/biodata")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setForm((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/biodata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        triggerToast("Biodata berhasil disimpan!");
      } else {
        triggerToast("Gagal menyimpan: " + data.error);
      }
    } catch {
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f8] text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0f487b] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Memuat Biodata Mahasiswa...</span>
        </div>
      </div>
    );
  }

  const navItems: { id: StudentTab; label: string; icon: string }[] = [
    { id: "biodata", label: "Biodata", icon: "👤" },
    { id: "informasi", label: "Informasi", icon: "ℹ️" },
    { id: "kelengkapan", label: "Kelengkapan", icon: "📋" },
    { id: "keluarga", label: "Keluarga", icon: "👥" },
    { id: "alamat", label: "Alamat", icon: "📍" },
    { id: "pendidikan", label: "Pendidikan", icon: "🎓" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-800 font-sans flex flex-col justify-between">
      {/* Top Header & Breadcrumb */}
      <div>
        <div className="bg-[#0f487b] text-white px-6 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-md transition flex items-center gap-1"
            >
              <span>←</span> Kembalike Beranda
            </Link>
            <span className="text-xs font-semibold text-white/80">
              SIAKAD Universitas Siber Asia — Biodata Mahasiswa
            </span>
          </div>
          <div className="text-xs font-bold font-mono">NIM: {form.nim}</div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT SIDEBAR TABS */}
          <div className="w-full lg:w-64 shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-sm p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activeTab === item.id
                    ? "bg-[#0f487b] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-1 w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative min-h-[480px]">
            {/* Header of Card */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-base font-bold text-slate-800 capitalize">
                {activeTab}
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-1.5 border border-slate-300 hover:border-[#0f487b] text-[#0f487b] text-xs font-bold rounded-md transition flex items-center gap-1.5 bg-white shadow-xs cursor-pointer"
              >
                <span>✏️</span>
                <span>{isEditing ? "Batal Edit" : "Edit"}</span>
              </button>
            </div>

            {/* TAB 1: BIODATA */}
            {activeTab === "biodata" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-xs">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={form.namaLengkap}
                      onChange={(e) => handleChange("namaLengkap", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={form.tempatLahir}
                      onChange={(e) => handleChange("tempatLahir", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      disabled={!isEditing}
                      value={form.tanggalLahir}
                      onChange={(e) => handleChange("tanggalLahir", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jenis Kelamin - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      disabled={!isEditing}
                      value={form.jenisKelamin}
                      onChange={(e) => handleChange("jenisKelamin", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Agama - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      disabled={!isEditing}
                      value={form.agama}
                      onChange={(e) => handleChange("agama", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    >
                      <option value="">Pilih Agama</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Suku - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      disabled={!isEditing}
                      value={form.suku}
                      onChange={(e) => handleChange("suku", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    >
                      <option value="">Pilih Suku</option>
                      <option value="Jawa">Jawa</option>
                      <option value="Sunda">Sunda</option>
                      <option value="Betawi">Betawi</option>
                      <option value="Batak">Batak</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pekerjaan - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      disabled={!isEditing}
                      value={form.pekerjaan}
                      onChange={(e) => handleChange("pekerjaan", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    >
                      <option value="">Pilih Pekerjaan</option>
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Karyawan Swasta">Karyawan Swasta</option>
                      <option value="Wiraswasta">Wiraswasta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tinggi Badan - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Masukkan Tinggi Badan"
                      value={form.tinggiBadan}
                      onChange={(e) => handleChange("tinggiBadan", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-0.5">Dalam cm</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Berat Badan - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Masukkan Berat Badan"
                      value={form.beratBadan}
                      onChange={(e) => handleChange("beratBadan", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-0.5">Dalam kg</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. Hp - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={form.noHp}
                      onChange={(e) => handleChange("noHp", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Pribadi - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={form.emailPribadi}
                      onChange={(e) => handleChange("emailPribadi", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-0.5">yourname@mail.com</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Kampus - <span className="italic text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      placeholder="Masukkan Email Kampus"
                      value={form.emailKampus}
                      onChange={(e) => handleChange("emailKampus", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b] focus:bg-white disabled:text-slate-700"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-0.5">mailkampus@mail.com</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INFORMASI */}
            {activeTab === "informasi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Studi</label>
                  <select
                    disabled={!isEditing}
                    value={form.prodi}
                    onChange={(e) => handleChange("prodi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b]"
                  >
                    <option value="S1 Informatika">S1 Informatika</option>
                    <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                    <option value="S1 Manajemen">S1 Manajemen</option>
                    <option value="S1 Akuntansi">S1 Akuntansi</option>
                    <option value="S1 Komunikasi">S1 Komunikasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIM</label>
                  <input
                    type="text"
                    disabled
                    value={form.nim}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester Saat Ini</label>
                  <select
                    disabled={!isEditing}
                    value={form.semester}
                    onChange={(e) => handleChange("semester", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:border-[#0f487b]"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosen Pembimbing Akademik (PA)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.dosenPa}
                    onChange={(e) => handleChange("dosenPa", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jalur Masuk</label>
                  <select
                    disabled={!isEditing}
                    value={form.jalurMasuk}
                    onChange={(e) => handleChange("jalurMasuk", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Beasiswa">Beasiswa</option>
                    <option value="RPL / Transfer">RPL / Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ukuran Jas Almamater</label>
                  <select
                    disabled={!isEditing}
                    value={form.ukuranJas}
                    onChange={(e) => handleChange("ukuranJas", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan Mahasiswa</label>
                  <span className="inline-block px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-md">
                    {form.statusMahasiswa}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: KELENGKAPAN */}
            {activeTab === "kelengkapan" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Kelengkapan
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                  {/* LEFT COLUMN */}
                  <div className="space-y-5">
                    {/* Nik */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Nik - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="1231234564567890"
                        value={form.nik}
                        onChange={(e) => handleChange("nik", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono"
                      />
                    </div>

                    {/* No kk */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        No kk - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Masukkan Nomor KK"
                        value={form.noKk}
                        onChange={(e) => handleChange("noKk", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono"
                      />
                    </div>

                    {/* No Passport */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        No Passport - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Masukkan Nomor Passport"
                        value={form.noPassport}
                        onChange={(e) => handleChange("noPassport", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                      />
                    </div>

                    {/* NISN */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        NISN - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Masukkan Nisn"
                        value={form.nisn}
                        onChange={(e) => handleChange("nisn", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono"
                      />
                    </div>

                    {/* NPSN */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        NPSN - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Masukkan npsn"
                        value={form.npsn}
                        onChange={(e) => handleChange("npsn", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-5">
                    {/* Tahun Lulus */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Tahun Lulus - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="2024"
                        value={form.tahunLulus}
                        onChange={(e) => handleChange("tahunLulus", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                      />
                    </div>

                    {/* Alamat */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Alamat - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                      </label>
                      <textarea
                        rows={4}
                        disabled={!isEditing}
                        placeholder="Alamat"
                        value={form.alamatKelengkapan}
                        onChange={(e) => handleChange("alamatKelengkapan", e.target.value)}
                        className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KELUARGA (Multi-Entry) */}
            {activeTab === "keluarga" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Lihat Data Keluarga
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daftar data seluruh anggota keluarga (Ayah, Ibu, Suami, Istri, Anak, Wali, Kakak, Adik).
                    </p>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const newFam: FamilyMemberItem = {
                          id: "fam-" + Date.now(),
                          jenisHubunganKeluarga: "",
                          namaAnggotaKeluarga: "",
                          nikAnggotaKeluarga: "",
                          statusHubunganKeluarga: "",
                          tempatLahirKeluarga: "",
                          tanggalLahirKeluarga: "",
                          noHpKeluarga: "",
                          emailKeluarga: "",
                          alamatKeluarga: "",
                          statusHidupKeluarga: "Hidup",
                        };
                        setForm((prev) => ({
                          ...prev,
                          riwayatKeluarga: [...prev.riwayatKeluarga, newFam],
                        }));
                      }}
                      className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Tambah Anggota Keluarga</span>
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  {form.riwayatKeluarga.map((fam, idx) => (
                    <div
                      key={fam.id}
                      className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-6 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#0f487b] text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-800 text-base">
                            {fam.jenisHubunganKeluarga || "Anggota Keluarga"} — {fam.namaAnggotaKeluarga || "Nama Belum Diisi"}
                          </span>
                        </div>
                        {isEditing && form.riwayatKeluarga.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                riwayatKeluarga: prev.riwayatKeluarga.filter((item) => item.id !== fam.id),
                              }));
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 cursor-pointer"
                          >
                            🗑️ Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                        {/* LEFT COLUMN */}
                        <div className="space-y-5">
                          {/* Jenis Hubungan Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Jenis Hubungan Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="Jenis Hubungan anggota keluarga (e.g. Ayah, Ibu, Suami, Istri, Anak)"
                              value={fam.jenisHubunganKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, jenisHubunganKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                          </div>

                          {/* Nama Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Nama Anggota Keluarga
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="Nama anggota keluarga"
                              value={fam.namaAnggotaKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, namaAnggotaKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                          </div>

                          {/* Nik Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Nik Anggota Keluarga
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="NIK anggota keluarga"
                              value={fam.nikAnggotaKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, nikAnggotaKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono"
                            />
                          </div>

                          {/* status Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              status Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="Status Hubungan anggota keluarga"
                              value={fam.statusHubunganKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, statusHubunganKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                          </div>

                          {/* Tempat Lahir Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Tempat Lahir Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <div className="relative">
                              <select
                                disabled={!isEditing}
                                value={fam.tempatLahirKeluarga}
                                onChange={(e) => {
                                  const updated = form.riwayatKeluarga.map((item) =>
                                    item.id === fam.id ? { ...item, tempatLahirKeluarga: e.target.value } : item
                                  );
                                  setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                                }}
                                className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 text-sm font-medium appearance-none pr-10"
                              >
                                <option value="">Tempat Lahir</option>
                                <option value="banda aceh">banda aceh</option>
                                <option value="jakarta">jakarta</option>
                                <option value="surabaya">surabaya</option>
                                <option value="medan">medan</option>
                                <option value="bandung">bandung</option>
                              </select>
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-xs">
                                ▼
                              </span>
                            </div>
                          </div>

                          {/* Tanggal Lahir Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Tanggal Lahir Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <div className="flex items-center rounded-xl bg-[#f0f3f6] border border-slate-200/80 overflow-hidden">
                              <div className="px-3.5 py-3 border-r border-slate-200 text-slate-500 bg-white/40 flex items-center justify-center">
                                📅
                              </div>
                              <input
                                type="date"
                                disabled={!isEditing}
                                placeholder="Tanggal Lahir Anggota Keluarga"
                                value={fam.tanggalLahirKeluarga}
                                onChange={(e) => {
                                  const updated = form.riwayatKeluarga.map((item) =>
                                    item.id === fam.id ? { ...item, tanggalLahirKeluarga: e.target.value } : item
                                  );
                                  setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                                }}
                                className="w-full px-4 py-3 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-5">
                          {/* NoHP Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              NoHP Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="NoHP anggota keluarga"
                              value={fam.noHpKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, noHpKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                          </div>

                          {/* Email Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Email Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <input
                              type="email"
                              disabled={!isEditing}
                              placeholder="Email anggota keluarga"
                              value={fam.emailKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, emailKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium"
                            />
                          </div>

                          {/* Alamat Anggota Keluarga */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Alamat Anggota Keluarga - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <textarea
                              rows={4}
                              disabled={!isEditing}
                              placeholder="Alamat Anggota Keluarga"
                              value={fam.alamatKeluarga}
                              onChange={(e) => {
                                const updated = form.riwayatKeluarga.map((item) =>
                                  item.id === fam.id ? { ...item, alamatKeluarga: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                              }}
                              className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium resize-y"
                            />
                          </div>

                          {/* Status Hidup */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                              Status Hidup - <span className="italic text-slate-400 font-medium text-xs">Optional</span>
                            </label>
                            <div className="relative">
                              <select
                                disabled={!isEditing}
                                value={fam.statusHidupKeluarga}
                                onChange={(e) => {
                                  const updated = form.riwayatKeluarga.map((item) =>
                                    item.id === fam.id ? { ...item, statusHidupKeluarga: e.target.value } : item
                                  );
                                  setForm((prev) => ({ ...prev, riwayatKeluarga: updated }));
                                }}
                                className="w-full px-4 py-3 bg-[#f0f3f6] border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#0f487b] focus:bg-white text-slate-800 text-sm font-medium appearance-none pr-10"
                              >
                                <option value="">Status Hidup</option>
                                <option value="Hidup">Hidup</option>
                                <option value="Meninggal">Meninggal</option>
                              </select>
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-xs">
                                ▼
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ALAMAT */}
            {activeTab === "alamat" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.provinsi}
                    onChange={(e) => handleChange("provinsi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.kabupaten}
                    onChange={(e) => handleChange("kabupaten", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.kecamatan}
                    onChange={(e) => handleChange("kecamatan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.kelurahan}
                    onChange={(e) => handleChange("kelurahan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.kodePos}
                    onChange={(e) => handleChange("kodePos", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Sesuai KTP</label>
                  <textarea
                    rows={3}
                    disabled={!isEditing}
                    value={form.alamatLengkap}
                    onChange={(e) => handleChange("alamatLengkap", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: PENDIDIKAN (Multi-Entry) */}
            {activeTab === "pendidikan" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      Riwayat Pendidikan Mahasiswa
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daftar riwayat pendidikan formal (SD, SMP, SMA/SMK, Diploma, S1, dll).
                    </p>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const newEdu: EducationItem = {
                          id: "edu-" + Date.now(),
                          jenjang: "SMA/SMK",
                          namaInstitusi: "",
                          npsn: "",
                          jurusan: "",
                          tahunMasuk: "",
                          tahunLulus: "",
                          nilaiAkhir: "",
                        };
                        setForm((prev) => ({
                          ...prev,
                          riwayatPendidikan: [...prev.riwayatPendidikan, newEdu],
                        }));
                      }}
                      className="px-4 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Tambah Riwayat Pendidikan</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {form.riwayatPendidikan.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0f487b] text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">
                            {edu.jenjang || "Riwayat Pendidikan"} — {edu.namaInstitusi || "Nama Sekolah/PT"}
                          </span>
                        </div>
                        {isEditing && form.riwayatPendidikan.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                riwayatPendidikan: prev.riwayatPendidikan.filter((e) => e.id !== edu.id),
                              }));
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition px-2.5 py-1 rounded bg-rose-50 border border-rose-100 cursor-pointer"
                          >
                            🗑️ Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Jenjang Pendidikan
                          </label>
                          <select
                            disabled={!isEditing}
                            value={edu.jenjang}
                            onChange={(e) => {
                              const updated = form.riwayatPendidikan.map((item) =>
                                item.id === edu.id ? { ...item, jenjang: e.target.value } : item
                              );
                              setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                          >
                            <option value="SD">SD / Sederajat</option>
                            <option value="SMP">SMP / Sederajat</option>
                            <option value="SMA/SMK">SMA / SMK / MA</option>
                            <option value="Diploma">Diploma (D3/D4)</option>
                            <option value="Sarjana">Sarjana (S1)</option>
                            <option value="Magister">Magister (S2)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Nama Sekolah / Perguruan Tinggi
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            placeholder="e.g. SMKN 1 Jakarta"
                            value={edu.namaInstitusi}
                            onChange={(e) => {
                              const updated = form.riwayatPendidikan.map((item) =>
                                item.id === edu.id ? { ...item, namaInstitusi: e.target.value } : item
                              );
                              setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            NPSN / Kode PT Asal
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            placeholder="e.g. 20109283"
                            value={edu.npsn}
                            onChange={(e) => {
                              const updated = form.riwayatPendidikan.map((item) =>
                                item.id === edu.id ? { ...item, npsn: e.target.value } : item
                              );
                              setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Jurusan / Program Studi
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            placeholder="e.g. Teknik Komputer & Jaringan"
                            value={edu.jurusan}
                            onChange={(e) => {
                              const updated = form.riwayatPendidikan.map((item) =>
                                item.id === edu.id ? { ...item, jurusan: e.target.value } : item
                              );
                              setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Tahun Masuk — Tahun Lulus
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="2017"
                              value={edu.tahunMasuk}
                              onChange={(e) => {
                                const updated = form.riwayatPendidikan.map((item) =>
                                  item.id === edu.id ? { ...item, tahunMasuk: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-center"
                            />
                            <span>—</span>
                            <input
                              type="text"
                              disabled={!isEditing}
                              placeholder="2020"
                              value={edu.tahunLulus}
                              onChange={(e) => {
                                const updated = form.riwayatPendidikan.map((item) =>
                                  item.id === edu.id ? { ...item, tahunLulus: e.target.value } : item
                                );
                                setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Nilai Ujian / IPK Akhir
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            placeholder="e.g. 88.50"
                            value={edu.nilaiAkhir}
                            onChange={(e) => {
                              const updated = form.riwayatPendidikan.map((item) =>
                                item.id === edu.id ? { ...item, nilaiAkhir: e.target.value } : item
                              );
                              setForm((prev) => ({ ...prev, riwayatPendidikan: updated }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button when in Edit mode */}
            {isEditing && (
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-xs rounded-md transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{saving ? "Menyimpan..." : "Simpan Biodata"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER MATCHING SCREENSHOT */}
      <footer className="mt-8 py-4 border-t border-slate-200/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between px-6 lg:px-12 bg-white">
        <div>2026 © Copyright BPPTI Universitas Siber Asia</div>
        <div>Design & Develop by BPPTI</div>
      </footer>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <span>✓</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
