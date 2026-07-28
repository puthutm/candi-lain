"use client";

import { ModalType } from "../AdminModals";

interface MatakuliahTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function MatakuliahTab({
  setActiveModal,
  triggerToast,
}: MatakuliahTabProps) {
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
              Master mata kuliah seluruh prodi. Setiap MK memiliki <strong>Dosen Koordinator</strong> yang bertanggung jawab atas substansi kurikulum dan koordinasi kelas paralel.
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
            placeholder="🔍 Cari kode atau nama MK..."
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
          />
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Program Studi</option>
            <option value="IF">S1 Informatika</option>
            <option value="SI">S1 Sistem Informasi</option>
            <option value="MJ">S1 Manajemen</option>
            <option value="AK">S1 Akuntansi</option>
            <option value="PSI">S1 Psikologi</option>
          </select>
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
          </select>
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Jenis (Wajib/Pilihan)</option>
            <option value="Wajib">Wajib Prodi</option>
            <option value="Pilihan">Pilihan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Katalog Mata Kuliah Active</h3>
          <span className="text-xs font-mono font-bold text-slate-500">11 Mata Kuliah Ditampilkan</span>
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
              {[
                { code: "IF201", name: "Algoritma & Struktur Data", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                { code: "IF203", name: "Pemrograman Berorientasi Objek", sks: 4, smt: 2, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                { code: "IF205", name: "Basis Data", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "3 Kelas (87 Mhs)", type: "Wajib" },
                { code: "IF207", name: "Jaringan Komputer", sks: 3, smt: 2, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "2 Kelas (58 Mhs)", type: "Wajib" },
                { code: "MK101", name: "Pendidikan Pancasila", sks: 2, smt: 1, prodi: "Universal MKWU", dosen: "Bp. Surya Hartanto", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
                { code: "MK103", name: "Bahasa Inggris", sks: 2, smt: 1, prodi: "Universal MKWU", dosen: "Ms. Diana Kartika", kelas: "6 Kelas (320 Mhs)", type: "Wajib" },
                { code: "MK105", name: "Kewirausahaan", sks: 2, smt: 3, prodi: "Universal MKWU", dosen: "Dr. Rini Susilowati", kelas: "5 Kelas (280 Mhs)", type: "Wajib" },
                { code: "IF209", name: "Pemrograman Web", sks: 4, smt: 3, prodi: "S1 Informatika", dosen: "Noviandri, S.Kom., MMSI.", kelas: "3 Kelas (85 Mhs)", type: "Wajib" },
                { code: "IF301", name: "Rekayasa Perangkat Lunak", sks: 3, smt: 4, prodi: "S1 Informatika", dosen: "Dr. Aulia Rahman, M.Kom.", kelas: "2 Kelas (76 Mhs)", type: "Wajib" },
                { code: "IF401", name: "AI & Machine Learning", sks: 3, smt: 5, prodi: "S1 Informatika", dosen: "Prof. Dr. Hendro Wijaksono", kelas: "1 Kelas (32 Mhs)", type: "Pilihan" },
                { code: "SI201", name: "Manajemen Proyek SI", sks: 3, smt: 2, prodi: "S1 Sistem Informasi", dosen: "Dr. Bayu Setiawan, M.T.", kelas: "2 Kelas (64 Mhs)", type: "Wajib" },
              ].map((item) => (
                <tr key={item.code} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{item.code}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {item.name}
                    <span className="block text-[10px] font-normal text-slate-400">{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{item.sks}</td>
                  <td className="px-4 py-3 text-center font-semibold">{item.smt}</td>
                  <td className="px-4 py-3">{item.prodi}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.dosen}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full">
                      {item.kelas}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
