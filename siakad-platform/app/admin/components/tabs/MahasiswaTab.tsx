"use client";

import { ModalType } from "../AdminModals";

interface MahasiswaTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function MahasiswaTab({
  setActiveModal,
  triggerToast,
}: MahasiswaTabProps) {
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
              3.719 mahasiswa aktif terdaftar. Klik baris untuk profil akademik lengkap, atau klik <strong>Edit Data</strong> untuk modifikasi biodata, wali, prodi, dan status registrasi.
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
            placeholder="🔍 Cari NIM atau nama mahasiswa..."
            className="md:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
          />
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Prodi</option>
            <option value="IF">S1 Informatika</option>
            <option value="SI">S1 Sistem Informasi</option>
            <option value="MJ">S1 Manajemen</option>
            <option value="AK">S1 Akuntansi</option>
          </select>
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Cuti Lapor">Cuti Lapor</option>
            <option value="Cuti Tidak Lapor">Cuti Tidak Lapor</option>
          </select>
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Jenis</option>
            <option value="Reguler">Reguler</option>
            <option value="Alih Jenjang">Alih Jenjang</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Mahasiswa (Sampel Roster Aktif)</h3>
          <span className="text-xs font-mono font-bold text-slate-500">3.719 Mahasiswa Terdaftar</span>
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
              {[
                { nim: "26090182", nama: "Budi Santoso", prodi: "S1 Informatika · 2026", smt: 1, ipk: "3.85", jenis: "Reguler", status: "Aktif" },
                { nim: "26090183", nama: "Siti Aminah", prodi: "S1 Sistem Informasi · 2026", smt: 1, ipk: "3.90", jenis: "Reguler", status: "Aktif" },
                { nim: "25090110", nama: "Ahmad Fauzi", prodi: "S1 Informatika · 2025", smt: 3, ipk: "3.42", jenis: "Alih Jenjang", status: "Cuti Lapor" },
                { nim: "24090099", nama: "Dewi Lestari", prodi: "S1 Manajemen · 2024", smt: 5, ipk: "3.75", jenis: "Reguler", status: "Aktif" },
              ].map((mhs) => (
                <tr key={mhs.nim} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{mhs.nim}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{mhs.nama}</td>
                  <td className="px-4 py-3">{mhs.prodi}</td>
                  <td className="px-4 py-3 text-center font-bold">{mhs.smt}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">{mhs.ipk}</td>
                  <td className="px-4 py-3">{mhs.jenis}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${mhs.status === "Aktif" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {mhs.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => triggerToast(`Mengedit data mahasiswa ${mhs.nama} (${mhs.nim})`)}
                      className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                    >
                      ✏️ Edit Data
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
