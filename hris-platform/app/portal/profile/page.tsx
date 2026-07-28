"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileTab =
  | "biodata"
  | "informasi"
  | "kelengkapan"
  | "keluarga"
  | "alamat"
  | "dokumen"
  | "rekening"
  | "pendidikan";

interface FamilyMember {
  id: string;
  nama: string;
  nik: string;
  hubungan: string;
  statusKekerabatan: string;
  statusHidup: string;
}

export default function CompleteProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("biodata");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [completenessPercent, setCompletenessPercent] = useState(35);

  // Form states matching screenshots
  const [form, setForm] = useState({
    // 1. BIODATA
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

    // 2. INFORMASI
    unitKerja: "",
    hubunganKerja: "",
    jenisPegawai: "",
    jabatanFungsional: "",
    noWa: "081122",
    ttdDigital: "",
    ttdBarcode: "",
    noAkunFinger: "",
    transportasi: "",
    ukuranJas: "",
    pekerjaan: "",
    statusKaryawan: "",
    posisiAkademik: "",
    programStudi: "S1 PJJ Informatika",

    // 3. KELENGKAPAN
    nidn: "",
    nupn: "",
    rumpunBidangIlmu: "",
    noPasport: "",
    idSinta: "",
    idScopus: "",
    idOrcid: "",
    tglSertifikasiDosen: "",
    noSertifikasi: "",
    fileSertifikasi: "",

    // 4. KELUARGA
    keluarga: [] as FamilyMember[],

    // 5. ALAMAT
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
    kodePos: "",
    jarakRumah: "0",
    alamat: "",

    // 6. DOKUMEN
    ktpFile: "",
    kkFile: "",
    npwpFile: "",

    // 7. REKENING
    namaBank: "Bank Mandiri",
    noRekening: "1230009876543",
    namaPemilikRek: "Budi Santoso",

    // 8. PENDIDIKAN
    pendidikanTerakhir: "S1 Informatika",
    institusi: "Universitas Siber Asia",
    tahunLulus: "2022",
  });

  // Modal State for Keluarga
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [famName, setFamName] = useState("");
  const [famNik, setFamNik] = useState("");
  const [famHub, setFamHub] = useState("Istri");
  const [famStatHub, setFamStatHub] = useState("Kandung");
  const [famStatHidup, setFamStatHidup] = useState("Hidup");
  const [familySearch, setFamilySearch] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetch("/api/portal/biodata")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setForm((prev) => ({ ...prev, ...data.data }));
          if (data.completenessPercent) {
            setCompletenessPercent(data.completenessPercent);
          }
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
      const res = await fetch("/api/portal/biodata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Data berhasil disimpan!");
      } else {
        triggerToast("Gagal menyimpan: " + data.error);
      }
    } catch {
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamily = () => {
    if (!famName) return;
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      nama: famName,
      nik: famNik,
      hubungan: famHub,
      statusKekerabatan: famStatHub,
      statusHidup: famStatHidup,
    };
    const updated = [...form.keluarga, newMember];
    setForm((prev) => ({ ...prev, keluarga: updated }));
    setShowFamilyModal(false);
    setFamName("");
    setFamNik("");
    triggerToast("Anggota keluarga ditambahkan!");
  };

  const handleDeleteFamily = (id: string) => {
    const updated = form.keluarga.filter((m) => m.id !== id);
    setForm((prev) => ({ ...prev, keluarga: updated }));
    triggerToast("Data keluarga dihapus.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0f487b] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Memuat Formulir Biodata...</span>
        </div>
      </div>
    );
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "biodata", label: "Biodata" },
    { id: "informasi", label: "Informasi" },
    { id: "kelengkapan", label: "Kelengkapan" },
    { id: "keluarga", label: "Keluarga" },
    { id: "alamat", label: "Alamat" },
    { id: "dokumen", label: "Dokumen" },
    { id: "rekening", label: "Rekening" },
    { id: "pendidikan", label: "Pendidikan" },
  ];

  const filteredKeluarga = form.keluarga.filter(
    (m) =>
      m.nama.toLowerCase().includes(familySearch.toLowerCase()) ||
      m.nik.includes(familySearch)
  );

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Link href="/portal" className="hover:text-[#0f487b]">
            🏠 Portal Pegawai
          </Link>
          <span>/</span>
          <span className="text-[#0f487b]">Complete Your Profile</span>
        </div>
        <Link
          href="/portal"
          className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm"
        >
          ← Kembali
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Progress Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Complete Your Profile</h3>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-rose-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${completenessPercent}%` }}
              ></div>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 text-right">
              {completenessPercent}% Selesai
            </p>
          </div>

          {/* Menu Items list */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeTab === t.id
                    ? "bg-[#0f487b] text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT FORM CONTENT */}
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 relative min-h-[500px]">
          {/* TAB 1: BIODATA */}
          {activeTab === "biodata" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Biodata
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">NIP</label>
                  <input
                    type="text"
                    value={form.nip}
                    onChange={(e) => handleChange("nip", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Gelar Depan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    value={form.gelarDepan}
                    onChange={(e) => handleChange("gelarDepan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Gelar Belakang - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    value={form.gelarBelakang}
                    onChange={(e) => handleChange("gelarBelakang", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Tempat Lahir</label>
                  <input
                    type="text"
                    value={form.tempatLahir}
                    onChange={(e) => handleChange("tempatLahir", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={form.tanggalLahir}
                    onChange={(e) => handleChange("tanggalLahir", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Jenis Kelamin</label>
                  <select
                    value={form.jenisKelamin}
                    onChange={(e) => handleChange("jenisKelamin", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="Laki - laki">Laki - laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Status Pernikahan</label>
                  <select
                    value={form.statusPernikahan}
                    onChange={(e) => handleChange("statusPernikahan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="Menikah">Menikah</option>
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Duda">Duda</option>
                    <option value="Janda">Janda</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Agama</label>
                  <select
                    value={form.agama}
                    onChange={(e) => handleChange("agama", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Suku - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    value={form.suku}
                    onChange={(e) => handleChange("suku", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Berat Badan (kg) - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="number"
                    value={form.beratBadan}
                    onChange={(e) => handleChange("beratBadan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Tinggi Badan (cm) - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="number"
                    value={form.tinggiBadan}
                    onChange={(e) => handleChange("tinggiBadan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Golongan Darah - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.golonganDarah}
                    onChange={(e) => handleChange("golonganDarah", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Golongan Darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Status Akun</label>
                  <select
                    value={form.statusAkun}
                    onChange={(e) => handleChange("statusAkun", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Kewarganegaraan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    value={form.kewarganegaraan}
                    onChange={(e) => handleChange("kewarganegaraan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INFORMASI */}
          {activeTab === "informasi" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Informasi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Unit Kerja</label>
                  <select
                    value={form.unitKerja}
                    onChange={(e) => handleChange("unitKerja", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Unit Kerja</option>
                    <option value="Informatika">Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Manajemen">Manajemen</option>
                    <option value="Akuntansi">Akuntansi</option>
                    <option value="BAAK">BAAK</option>
                    <option value="BPPTI">BPPTI</option>
                    <option value="Biro SDM">Biro SDM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Hubungan Kerja</label>
                  <select
                    value={form.hubunganKerja}
                    onChange={(e) => handleChange("hubunganKerja", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Hubungan Kerja</option>
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Dosen LB">Dosen LB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Jenis Pegawai - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.jenisPegawai}
                    onChange={(e) => handleChange("jenisPegawai", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Jenis Pegawai</option>
                    <option value="Dosen">Dosen</option>
                    <option value="Tendik">Tendik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Jabatan Fungsional - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.jabatanFungsional}
                    onChange={(e) => handleChange("jabatanFungsional", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Jabatan Fungsional</option>
                    <option value="Asisten Ahli">Asisten Ahli</option>
                    <option value="Lektor">Lektor</option>
                    <option value="Lektor Kepala">Lektor Kepala</option>
                    <option value="Guru Besar">Guru Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Nomor Telepon (WA)</label>
                  <input
                    type="text"
                    value={form.noWa}
                    onChange={(e) => handleChange("noWa", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Tanda Tangan Digital - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Upload Tanda Tangan Digital"
                      value={form.ttdDigital}
                      onChange={(e) => handleChange("ttdDigital", e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 text-[11px]">
                      <span>📤 Upload</span>
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">File dalam bentuk .jpg, .jpeg atau .png max 2mb.</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Tanda Tangan Barcode - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tanda Tangan Barcode"
                      value={form.ttdBarcode}
                      onChange={(e) => handleChange("ttdBarcode", e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 text-[11px]">
                      <span>📤 Upload</span>
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">File dalam bentuk .jpg, .jpeg atau .png max 2mb.</p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">No Akun Finger</label>
                  <input
                    type="text"
                    placeholder="No Akun Finger"
                    value={form.noAkunFinger}
                    onChange={(e) => handleChange("noAkunFinger", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Transportasi - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.transportasi}
                    onChange={(e) => handleChange("transportasi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Transportasi</option>
                    <option value="Kendaraan Pribadi">Kendaraan Pribadi</option>
                    <option value="Transportasi Umum">Transportasi Umum</option>
                    <option value="Jalan Kaki">Jalan Kaki</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Ukuran Jas Almamater - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.ukuranJas}
                    onChange={(e) => handleChange("ukuranJas", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Ukuran</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Pekerjaan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.pekerjaan}
                    onChange={(e) => handleChange("pekerjaan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Pekerjaan</option>
                    <option value="Dosen Tetap">Dosen Tetap</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                    <option value="Peneliti">Peneliti</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Status Karyawan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.statusKaryawan}
                    onChange={(e) => handleChange("statusKaryawan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Tugas Belajar">Tugas Belajar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Posisi Akademik - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.posisiAkademik}
                    onChange={(e) => handleChange("posisiAkademik", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Posisi</option>
                    <option value="Kaprodi">Kaprodi</option>
                    <option value="Sekprodi">Sekprodi</option>
                    <option value="Dosen Pengajar">Dosen Pengajar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Program Studi - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.programStudi}
                    onChange={(e) => handleChange("programStudi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="S1 PJJ Informatika">S1 PJJ Informatika</option>
                    <option value="S1 PJJ Sistem Informasi">S1 PJJ Sistem Informasi</option>
                    <option value="S1 PJJ Manajemen">S1 PJJ Manajemen</option>
                    <option value="S1 PJJ Akuntansi">S1 PJJ Akuntansi</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KELENGKAPAN */}
          {activeTab === "kelengkapan" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Kelengkapan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    NIDN - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan NIDN"
                    value={form.nidn}
                    onChange={(e) => handleChange("nidn", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    NUPN - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan NUPN"
                    value={form.nupn}
                    onChange={(e) => handleChange("nupn", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Rumpun Bidang Ilmu - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.rumpunBidangIlmu}
                    onChange={(e) => handleChange("rumpunBidangIlmu", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Rumpun Bidang Ilmu</option>
                    <option value="Ilmu Komputer / Informatika">Ilmu Komputer / Informatika</option>
                    <option value="Teknik & Rekayasa">Teknik & Rekayasa</option>
                    <option value="Ekonomi & Bisnis">Ekonomi & Bisnis</option>
                    <option value="Social & Politik">Social & Politik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    No Pasport - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan No Pasport"
                    value={form.noPasport}
                    onChange={(e) => handleChange("noPasport", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    ID Sinta - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan ID Sinta"
                    value={form.idSinta}
                    onChange={(e) => handleChange("idSinta", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    ID Scopus - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan ID Scopus"
                    value={form.idScopus}
                    onChange={(e) => handleChange("idScopus", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    ID Orcid - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan ID Orchid"
                    value={form.idOrcid}
                    onChange={(e) => handleChange("idOrcid", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Tgl Sertifikasi Dosen - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="date"
                    value={form.tglSertifikasiDosen}
                    onChange={(e) => handleChange("tglSertifikasiDosen", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    No Sertifikasi - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan No Sertifikasi"
                    value={form.noSertifikasi}
                    onChange={(e) => handleChange("noSertifikasi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    File Sertifikasi Dosen - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="File Sertifikasi Dosen"
                      value={form.fileSertifikasi}
                      onChange={(e) => handleChange("fileSertifikasi", e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 text-[11px]">
                      <span>📤 Upload</span>
                      <input type="file" className="hidden" accept="application/pdf,image/*" />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">File dalam bentuk .jpg, .jpeg, .png atau .pdf max 2mb.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KELUARGA */}
          {activeTab === "keluarga" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFamilyModal(true)}
                    className="px-4 py-2 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1"
                  >
                    <span>+</span> Tambah
                  </button>
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, keluarga: [] }))}
                    className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-sm"
                  >
                    🗑 Trash
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">NIK</th>
                      <th className="p-3">Hubungan Kekerabatan</th>
                      <th className="p-3">Status Kekerabatan</th>
                      <th className="p-3">Status Hidup</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredKeluarga.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      filteredKeluarga.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-bold">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800">{item.nama}</td>
                          <td className="p-3 font-mono">{item.nik || "-"}</td>
                          <td className="p-3">{item.hubungan}</td>
                          <td className="p-3">{item.statusKekerabatan}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.statusHidup === "Hidup"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {item.statusHidup}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteFamily(item.id)}
                              className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ALAMAT */}
          {activeTab === "alamat" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Alamat
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Provinsi - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.provinsi}
                    onChange={(e) => handleChange("provinsi", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Provinsi</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Banten">Banten</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Kabupaten - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.kabupaten}
                    onChange={(e) => handleChange("kabupaten", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Kabupaten</option>
                    <option value="Jakarta Selatan">Jakarta Selatan</option>
                    <option value="Jakarta Barat">Jakarta Barat</option>
                    <option value="Depok">Depok</option>
                    <option value="Bogor">Bogor</option>
                    <option value="Tangerang">Tangerang</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Kecamatan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.kecamatan}
                    onChange={(e) => handleChange("kecamatan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Kecamatan</option>
                    <option value="Beji">Beji</option>
                    <option value="Cilandak">Cilandak</option>
                    <option value="Kebayoran Baru">Kebayoran Baru</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Kelurahan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <select
                    value={form.kelurahan}
                    onChange={(e) => handleChange("kelurahan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  >
                    <option value="">Pilih Kelurahan</option>
                    <option value="Pondok Cina">Pondok Cina</option>
                    <option value="Cilandak Barat">Cilandak Barat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Kode Pos - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Kode Pos"
                    value={form.kodePos}
                    onChange={(e) => handleChange("kodePos", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Jarak Rumah (km) - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="number"
                    value={form.jarakRumah}
                    onChange={(e) => handleChange("jarakRumah", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Alamat - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Alamat lengkap"
                    value={form.alamat}
                    onChange={(e) => handleChange("alamat", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOKUMEN */}
          {activeTab === "dokumen" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const docName = prompt("Nama Dokumen:");
                      if (!docName) return;
                      const catName = prompt("Kategori Dokumen (KTP/KK/NPWP/Lainnya):") || "Umum";
                      setForm((prev: any) => ({
                        ...prev,
                        dokumenList: [
                          ...(prev.dokumenList || []),
                          { id: Date.now().toString(), nama: docName, kategori: catName },
                        ],
                      }));
                      triggerToast("Dokumen ditambahkan!");
                    }}
                    className="px-4 py-2 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Tambah
                  </button>
                  <button
                    onClick={() => setForm((prev: any) => ({ ...prev, dokumenList: [] }))}
                    className="px-3 py-2 bg-[#ff5252] hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    🗑 Trash
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Kategori Dokumen</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {!(form as any).dokumenList || (form as any).dokumenList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      (form as any).dokumenList.map((doc: any, idx: number) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-bold">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800">{doc.nama}</td>
                          <td className="p-3">{doc.kategori}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setForm((prev: any) => ({
                                  ...prev,
                                  dokumenList: prev.dokumenList.filter((d: any) => d.id !== doc.id),
                                }));
                              }}
                              className="text-rose-500 font-bold text-xs"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: REKENING */}
          {activeTab === "rekening" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Rekening
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Bank</label>
                  <select
                    value={form.namaBank}
                    onChange={(e) => handleChange("namaBank", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  >
                    <option value="">Pilih Bank</option>
                    <option value="Bank Mandiri">Bank Mandiri</option>
                    <option value="Bank BNI">Bank BNI</option>
                    <option value="Bank BRI">Bank BRI</option>
                    <option value="Bank BCA">Bank BCA</option>
                    <option value="Bank Syariah Indonesia">Bank Syariah Indonesia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">No Rekening</label>
                  <input
                    type="text"
                    placeholder="Masukkan No Rekening"
                    value={form.noRekening}
                    onChange={(e) => handleChange("noRekening", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Nama Kepemilikan Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan Nama"
                    value={form.namaPemilikRek}
                    onChange={(e) => handleChange("namaPemilikRek", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Cabang Bank - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan Cabang Bank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1.5">
                    Buku Tabungan - <span className="italic text-slate-400 font-normal">Opsional</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pilih Buku Tabungan"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      readOnly
                    />
                    <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 text-xs shadow-sm">
                      <span>📤 Upload</span>
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    File dalam bentuk .jpg, .jpeg atau .png max 2mb.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PENDIDIKAN */}
          {activeTab === "pendidikan" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const tingkat = prompt("Tingkat Pendidikan (S1/S2/S3/SMA):") || "S1";
                      const sekolah = prompt("Nama Sekolah / Perguruan Tinggi:") || "";
                      if (!sekolah) return;
                      const prodi = prompt("Program Studi:") || "";
                      const nim = prompt("NIM / NISN:") || "";
                      setForm((prev: any) => ({
                        ...prev,
                        pendidikanList: [
                          ...(prev.pendidikanList || []),
                          { id: Date.now().toString(), tingkat, sekolah, prodi, nim },
                        ],
                      }));
                      triggerToast("Pendidikan ditambahkan!");
                    }}
                    className="px-4 py-2 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Tambah
                  </button>
                  <button
                    onClick={() => setForm((prev: any) => ({ ...prev, pendidikanList: [] }))}
                    className="px-3 py-2 bg-[#ff5252] hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    🗑 Trash
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f487b]"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Tingkat Pendidikan</th>
                      <th className="p-3">Nama Sekolah atau Perguruan Tinggi</th>
                      <th className="p-3">Program Studi</th>
                      <th className="p-3">NIM/NISN</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {!(form as any).pendidikanList || (form as any).pendidikanList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      (form as any).pendidikanList.map((p: any, idx: number) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-bold">{idx + 1}</td>
                          <td className="p-3 font-semibold">{p.tingkat}</td>
                          <td className="p-3 font-semibold text-slate-800">{p.sekolah}</td>
                          <td className="p-3">{p.prodi}</td>
                          <td className="p-3 font-mono">{p.nim}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setForm((prev: any) => ({
                                  ...prev,
                                  pendidikanList: prev.pendidikanList.filter((item: any) => item.id !== p.id),
                                }));
                              }}
                              className="text-rose-500 font-bold text-xs"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                1 of {(form as any).pendidikanList?.length || 0}
              </div>
            </div>
          )}

          {/* GREEN SIMPAN BUTTON AT BOTTOM RIGHT */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH KELUARGA */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">
              Tambah Anggota Keluarga
            </h3>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={famName}
                onChange={(e) => setFamName(e.target.value)}
                placeholder="Nama anggota keluarga"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">NIK</label>
              <input
                type="text"
                value={famNik}
                onChange={(e) => setFamNik(e.target.value)}
                placeholder="NIK anggota keluarga"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Hubungan</label>
                <select
                  value={famHub}
                  onChange={(e) => setFamHub(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Istri">Istri</option>
                  <option value="Suami">Suami</option>
                  <option value="Anak">Anak</option>
                  <option value="Orang Tua">Orang Tua</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Kekerabatan</label>
                <select
                  value={famStatHub}
                  onChange={(e) => setFamStatHub(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Kandung">Kandung</option>
                  <option value="Angkat">Angkat</option>
                  <option value="Tiri">Tiri</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={famStatHidup}
                  onChange={(e) => setFamStatHidup(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Hidup">Hidup</option>
                  <option value="Meninggal">Meninggal</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowFamilyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAddFamily}
                className="px-4 py-2 bg-[#00bfa5] hover:bg-[#00a892] text-white font-bold rounded-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

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
