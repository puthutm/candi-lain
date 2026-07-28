"use client";

import { ModalType } from "../AdminModals";

interface KelasTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function KelasTab({
  setActiveModal,
  triggerToast,
}: KelasTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Operasional
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Kelas Kuliah · Periode 2026/2027 Ganjil</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              42 kelas aktif berjalan. Klik baris untuk detail kelas (mahasiswa terdaftar, nilai, & absensi). Tombol <strong>Buka Kelas Paralel</strong> untuk menambah kelas pengulangan otomatis dari MK yang sudah ada.
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Kelas</span>
          <p className="font-display font-black text-2xl text-slate-800">42</p>
          <p className="text-[10px] text-slate-500 font-bold">22 program studi</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Kelas Aktif</span>
          <p className="font-display font-black text-2xl text-emerald-700">38</p>
          <p className="text-[10px] text-emerald-600 font-bold">Quota terisi {">"} 80%</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-violet-700 uppercase font-bold tracking-wider">Kelas Paralel</span>
          <p className="font-display font-black text-2xl text-violet-700">12</p>
          <p className="text-[10px] text-violet-600 font-bold">3 MK dengan ≥2 kelas</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Kelas Online</span>
          <p className="font-display font-black text-2xl text-amber-700">14</p>
          <p className="text-[10px] text-amber-600 font-bold">Zoom + LMS</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Kelas Perkuliahan Berjalan</h3>
          <button
            onClick={() => setActiveModal("tambah_kelas")}
            className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
          >
            + Buka Kelas Paralel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID Kelas</th>
                <th className="px-4 py-3">Mata Kuliah</th>
                <th className="px-4 py-3">Dosen Pengajar</th>
                <th className="px-4 py-3">Jadwal Hari & Jam</th>
                <th className="px-4 py-3">Ruang</th>
                <th className="px-4 py-3 text-center">Kuota</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "KLS-IF201-A", mk: "IF201 · Algoritma & Struktur Data (Kelas A)", dosen: "Dr. Aulia Rahman, M.Kom.", jadwal: "Senin, 08:00-11:00", ruang: "Lab Komputer 1", kuota: "32 / 35", status: "Aktif (Synced LMS)" },
                { id: "KLS-IF201-B", mk: "IF201 · Algoritma & Struktur Data (Kelas B)", dosen: "Bp. Yusuf Andi, S.Kom., M.T.", jadwal: "Selasa, 13:00-16:00", ruang: "Lab Komputer 1", kuota: "30 / 35", status: "Paralel (Kelas A)" },
                { id: "KLS-IF201-C", mk: "IF201 · Algoritma & Struktur Data (Kelas C)", dosen: "Noviandri, S.Kom., MMSI.", jadwal: "Rabu, 19:00-22:00", ruang: "Online (Zoom)", kuota: "25 / 35", status: "Paralel (Kelas A)" },
                { id: "KLS-IF203-A", mk: "IF203 · Pemrograman Berorientasi Objek (Kelas A)", dosen: "Noviandri, S.Kom., MMSI.", jadwal: "Senin, 13:00-17:00", ruang: "Lab Komputer 2", kuota: "33 / 35", status: "Aktif (Synced LMS)" },
                { id: "KLS-IF205-A", mk: "IF205 · Basis Data (Kelas A)", dosen: "Dr. Bayu Setiawan, M.T.", jadwal: "Selasa, 08:00-11:00", ruang: "Lab Basis Data", kuota: "31 / 35", status: "Aktif (Synced LMS)" },
                { id: "KLS-IF207-A", mk: "IF207 · Jaringan Komputer (Kelas A)", dosen: "Prof. Dr. Hendro Wijaksono", jadwal: "Kamis, 13:00-16:00", ruang: "Lab Jaringan", kuota: "28 / 30", status: "Aktif (Synced LMS)" },
                { id: "KLS-MK101-A", mk: "MK101 · Pendidikan Pancasila (Kelas A)", dosen: "Bp. Surya Hartanto", jadwal: "Jumat, 08:00-10:00", ruang: "R201", kuota: "48 / 50", status: "Aktif (Synced LMS)" },
                { id: "KLS-MK103-A", mk: "MK103 · Bahasa Inggris (Kelas A)", dosen: "Ms. Diana Kartika", jadwal: "Sabtu, 08:00-10:00", ruang: "Online", kuota: "47 / 50", status: "Aktif (Synced LMS)" },
              ].map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{cls.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{cls.mk}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{cls.dosen}</td>
                  <td className="px-4 py-3 font-semibold">{cls.jadwal}</td>
                  <td className="px-4 py-3">{cls.ruang}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{cls.kuota}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      ● {cls.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => triggerToast(`Membuka workspace detail ${cls.id}`)}
                      className="text-[#0f487b] hover:underline font-bold cursor-pointer"
                    >
                      Detail & Peserta →
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
