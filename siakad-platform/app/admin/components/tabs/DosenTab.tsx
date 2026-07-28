"use client";

import { ModalType } from "../AdminModals";

interface DosenTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function DosenTab({
  setActiveModal,
  triggerToast,
}: DosenTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                SDM Akademik
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Dosen & Pengampu UNSIA</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Data dosen <strong>synced & read-only</strong> dari modul HRIS. Total 98 Dosen Tetap + 54 Dosen LB. Cek beban mengajar SKS dan penugasan MK Koordinator.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => triggerToast("Membuka Portal SDM / HRIS Platform...")}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              ↗ Buka HRIS
            </button>
            <button
              onClick={() => setActiveModal("tambah_dosen")}
              className="px-3.5 py-2 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              + Tambah Dosen
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            placeholder="🔍 Cari NIP / NIDN atau nama dosen..."
            className="md:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
          />
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Jenis Dosen</option>
            <option value="Dosen Tetap">Dosen Tetap</option>
            <option value="Dosen LB">Dosen LB</option>
          </select>
          <select className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
            <option value="">Semua Fakultas</option>
            <option value="FTI">Fakultas Teknologi Informasi</option>
            <option value="FEB">Fakultas Ekonomi & Bisnis</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Roster Dosen & Tenaga Pengajar</h3>
          <span className="text-xs font-mono font-bold text-slate-500">152 Dosen Terdaftar</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">NIP / NIDN</th>
                <th className="px-4 py-3">Nama & Gelar</th>
                <th className="px-4 py-3">Fakultas · Homebase</th>
                <th className="px-4 py-3">MK Koordinator</th>
                <th className="px-4 py-3 text-center">Beban (Jam/Mgg)</th>
                <th className="px-4 py-3">Jabatan Fungsional</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { nip: "0421098501", nama: "Dr. Aulia Rahman, M.Kom.", prodi: "FTI · S1 Informatika", mk: "Algoritma & Struktur Data", beban: "12 Jam", fungsional: "Lektor Kepala", status: "Dosen Tetap" },
                { nip: "0415088203", nama: "Noviandri, S.Kom., MMSI.", prodi: "FTI · S1 Informatika", mk: "Pemrograman Web", beban: "14 Jam", fungsional: "Lektor", status: "Dosen Tetap" },
                { nip: "0408127902", nama: "Dr. Bayu Setiawan, M.T.", prodi: "FTI · S1 Sistem Informasi", mk: "Basis Data", beban: "10 Jam", fungsional: "Lektor Kepala", status: "Dosen Tetap" },
                { nip: "0401017001", nama: "Prof. Dr. Hendro Wijaksono", prodi: "FTI · S1 Informatika", mk: "Jaringan Komputer", beban: "8 Jam", fungsional: "Guru Besar", status: "Dosen Tetap" },
              ].map((dsn) => (
                <tr key={dsn.nip} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{dsn.nip}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{dsn.nama}</td>
                  <td className="px-4 py-3">{dsn.prodi}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{dsn.mk}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{dsn.beban}</td>
                  <td className="px-4 py-3">{dsn.fungsional}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      {dsn.status}
                    </span>
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
