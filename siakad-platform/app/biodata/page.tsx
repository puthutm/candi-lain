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
    nik: "3174012903010002",
    noKk: "3174012903010001",
    npwp: "",
    bpjs: "",

    // 4. KELUARGA
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

    // 6. PENDIDIKAN
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.nik}
                    onChange={(e) => handleChange("nik", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.noKk}
                    onChange={(e) => handleChange("noKk", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPWP - <span className="italic text-slate-400">Optional</span></label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Masukkan NPWP"
                    value={form.npwp}
                    onChange={(e) => handleChange("npwp", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No BPJS Kesehatan / Ketenagakerjaan - <span className="italic text-slate-400">Optional</span></label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Masukkan No BPJS"
                    value={form.bpjs}
                    onChange={(e) => handleChange("bpjs", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: KELUARGA */}
            {activeTab === "keluarga" && (
              <div className="space-y-6 text-xs">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <h4 className="font-bold text-[#0f487b] border-b pb-2 uppercase tracking-wider text-[11px]">Data Ayah Kandung</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Ayah</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={form.ayahNama}
                        onChange={(e) => handleChange("ayahNama", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={form.ayahPekerjaan}
                        onChange={(e) => handleChange("ayahPekerjaan", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <h4 className="font-bold text-[#0f487b] border-b pb-2 uppercase tracking-wider text-[11px]">Data Ibu Kandung</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Ibu</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={form.ibuNama}
                        onChange={(e) => handleChange("ibuNama", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={form.ibuPekerjaan}
                        onChange={(e) => handleChange("ibuPekerjaan", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
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

            {/* TAB 6: PENDIDIKAN */}
            {activeTab === "pendidikan" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asal Sekolah / PT Asal</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.asalSekolah}
                    onChange={(e) => handleChange("asalSekolah", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NPSN / Kode PT Asal</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.npsn}
                    onChange={(e) => handleChange("npsn", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program Studi Asal</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.jurusanSekolah}
                    onChange={(e) => handleChange("jurusanSekolah", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Lulus</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={form.tahunLulus}
                    onChange={(e) => handleChange("tahunLulus", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-md"
                  />
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
