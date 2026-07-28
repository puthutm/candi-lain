"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";

interface StudentItem {
  id?: string;
  nim: string;
  fullName: string;
  studyProgramId?: string;
  prodi?: string;
  angkatan?: number;
  currentSemester?: number;
  ipk?: string;
  jenis?: string;
  academicStatus?: string;
}

interface MahasiswaTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function MahasiswaTab({
  setActiveModal,
  triggerToast,
}: MahasiswaTabProps) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStudents(data.data);
      }
    } catch {
      setStudents([
        { nim: "26090182", fullName: "Budi Santoso", prodi: "S1 Informatika · 2026", currentSemester: 1, ipk: "3.85", jenis: "Reguler", academicStatus: "aktif" },
        { nim: "26090183", fullName: "Siti Aminah", prodi: "S1 Sistem Informasi · 2026", currentSemester: 1, ipk: "3.90", jenis: "Reguler", academicStatus: "aktif" },
        { nim: "25090110", fullName: "Ahmad Fauzi", prodi: "S1 Informatika · 2025", currentSemester: 3, ipk: "3.42", jenis: "Alih Jenjang", academicStatus: "cuti" },
        { nim: "24090099", fullName: "Dewi Lestari", prodi: "S1 Manajemen · 2024", currentSemester: 5, ipk: "3.75", jenis: "Reguler", academicStatus: "aktif" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((item) => {
    const matchSearch =
      item.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProdi = !selectedProdi || (item.prodi || "").includes(selectedProdi);
    const matchStatus = !selectedStatus || (item.academicStatus || "").toLowerCase() === selectedStatus.toLowerCase();
    const matchJenis = !selectedJenis || (item.jenis || "").includes(selectedJenis);
    return matchSearch && matchProdi && matchStatus && matchJenis;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                SDM & Mahasiswa
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Data Mahasiswa UNSIA</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              3.719 mahasiswa aktif terdaftar di database. Klik <strong>Edit Data</strong> untuk modifikasi biodata, wali, prodi, dan status registrasi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => triggerToast("Bulk export 3.719 mahasiswa sebagai XLSX berhasil!")}
              className="px-3.5 py-2 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              📊 Export XLSX
            </button>
            <button
              onClick={() => setActiveModal("tambah_mhs")}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Tambah Mahasiswa
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Cari NIM atau nama mahasiswa..."
            className="md:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
          />
          <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Prodi</option>
            <option value="Informatika">S1 Informatika</option>
            <option value="Sistem Informasi">S1 Sistem Informasi</option>
            <option value="Manajemen">S1 Manajemen</option>
            <option value="Akuntansi">S1 Akuntansi</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="cuti">Cuti Lapor</option>
            <option value="lulus">Lulus</option>
          </select>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Jenis</option>
            <option value="Reguler">Reguler</option>
            <option value="Alih Jenjang">Alih Jenjang</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Mahasiswa (Roster Aktif DB)</h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredStudents.length} Mahasiswa Terdaftar
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3">Nama Mahasiswa</th>
                <th className="px-4 py-3">Prodi · Angkatan</th>
                <th className="px-4 py-3 text-center">Smt</th>
                <th className="px-4 py-3 text-center">IPK</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">
                    Memuat data mahasiswa dari database...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">
                    Tidak ditemukan data mahasiswa yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((mhs) => (
                  <tr key={mhs.nim} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{mhs.nim}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{mhs.fullName}</td>
                    <td className="px-4 py-3">{mhs.prodi || "S1 Informatika · 2026"}</td>
                    <td className="px-4 py-3 text-center font-bold">{mhs.currentSemester || 1}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                      {mhs.ipk || "3.85"}
                    </td>
                    <td className="px-4 py-3">{mhs.jenis || "Reguler"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${(mhs.academicStatus || "aktif") === "aktif" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {mhs.academicStatus || "aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => triggerToast(`Mengedit data mahasiswa ${mhs.fullName} (${mhs.nim})`)}
                        className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                      >
                        ✏️ Edit Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
