"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";

interface CourseItem {
  id?: string;
  code: string;
  name: string;
  sks: number;
  type?: string;
  semester?: number;
  prodi?: string;
  dosen?: string;
  kelas?: string;
}

interface MatakuliahTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function MatakuliahTab({
  setActiveModal,
  triggerToast,
}: MatakuliahTabProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic?type=matakuliah");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCourses(data.data);
      }
    } catch {
      // Fallback sample data
      setCourses([
        { code: "IF201", name: "Algoritma & Struktur Data", sks: 3, semester: 2, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
        { code: "IF203", name: "Pemrograman Berorientasi Objek", sks: 4, semester: 2, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
        { code: "IF205", name: "Basis Data", sks: 3, semester: 2, prodi: "S1 Informatika", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
        { code: "IF207", name: "Jaringan Komputer", sks: 3, semester: 2, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "2 Kelas (58 Mhs)", type: "Wajib" },
        { code: "MK101", name: "Pendidikan Pancasila", sks: 2, semester: 1, prodi: "Universal MKWU", dosen: "Bp. Surya Hartanto", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
        { code: "MK103", name: "Bahasa Inggris", sks: 2, semester: 1, prodi: "Universal MKWU", dosen: "Ms. Diana Kartika", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
        { code: "MK105", name: "Kewirausahaan", sks: 2, semester: 3, prodi: "Universal MKWU", dosen: "Dr. Rini Susilowati", kelas: "5 Kelas (280 Mhs)", type: "Wajib" },
        { code: "IF209", name: "Pemrograman Web", sks: 4, semester: 3, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (85 Mhs)", type: "Wajib" },
        { code: "IF301", name: "Rekayasa Perangkat Lunak", sks: 3, semester: 4, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "2 Kelas (76 Mhs)", type: "Wajib" },
        { code: "IF401", name: "AI & Machine Learning", sks: 3, semester: 5, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "1 Kelas (32 Mhs)", type: "Pilihan" },
        { code: "SI201", name: "Manajemen Proyek SI", sks: 3, semester: 2, prodi: "S1 Sistem Informasi", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "2 Kelas (64 Mhs)", type: "Wajib" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProdi = !selectedProdi || (item.prodi || "").includes(selectedProdi);
    const matchSemester = !selectedSemester || String(item.semester || 1) === selectedSemester;
    const matchType = !selectedType || (item.type || "").includes(selectedType);
    return matchSearch && matchProdi && matchSemester && matchType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FED524]">
                Master Akademik
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Mata Kuliah UNSIA</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Master mata kuliah seluruh prodi terintegrasi database PostgreSQL. Setiap MK memiliki <strong>Dosen Koordinator</strong> yang bertanggung jawab atas substansi kurikulum.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_mk")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Mata Kuliah
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Cari kode atau nama MK..."
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
          />
          <select
            value={selectedProdi}
            onChange={(e) => setSelectedProdi(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Program Studi</option>
            <option value="Informatika">S1 Informatika</option>
            <option value="Sistem Informasi">S1 Sistem Informasi</option>
            <option value="Manajemen">S1 Manajemen</option>
            <option value="Akuntansi">S1 Akuntansi</option>
            <option value="Psikologi">S1 Psikologi</option>
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
          >
            <option value="">Semua Jenis (Wajib/Pilihan)</option>
            <option value="wajib">Wajib Prodi</option>
            <option value="pilihan">Pilihan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Katalog Mata Kuliah Active</h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredCourses.length} Mata Kuliah Ditampilkan
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Mata Kuliah</th>
                <th className="px-4 py-3 text-center">SKS</th>
                <th className="px-4 py-3 text-center">Smt</th>
                <th className="px-4 py-3">Prodi</th>
                <th className="px-4 py-3">Dosen Koordinator</th>
                <th className="px-4 py-3 text-center">Kelas Paralel</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">
                    Memuat data mata kuliah dari database...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">
                    Tidak ditemukan mata kuliah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{item.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.name}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {item.type || "Wajib"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{item.sks}</td>
                    <td className="px-4 py-3 text-center font-semibold">{item.semester || 1}</td>
                    <td className="px-4 py-3">{item.prodi || "S1 Informatika"}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {item.dosen || "Dr. Aulia Rahman, M.Kom."}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full">
                        {item.kelas || "2 Kelas"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => triggerToast(`Detail mata kuliah ${item.name} (${item.code})`)}
                        className="text-[#0f487b] hover:underline font-bold cursor-pointer"
                      >
                        Edit / Detail →
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
