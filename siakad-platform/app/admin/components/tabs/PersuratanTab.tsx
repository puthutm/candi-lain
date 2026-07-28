"use client";

import { ModalType } from "../AdminModals";

interface PersuratanTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function PersuratanTab({
  setActiveModal,
  triggerToast,
}: PersuratanTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Layanan Akademik
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Persuratan Akademik</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Request surat: aktif kuliah, cuti, rekomendasi, transkrip, & pengantar penelitian. <strong>7 surat menunggu proses</strong>.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_surat")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Buat Surat Baru
          </button>
        </div>
      </div>

      {/* 4 Service KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Bulan Ini</span>
          <p className="font-display font-black text-2xl text-slate-800">42</p>
          <p className="text-[10px] text-emerald-600 font-bold">+8 vs bulan lalu</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Diproses</span>
          <p className="font-display font-black text-2xl text-amber-700">7</p>
          <p className="text-[10px] text-amber-600 font-bold">SLA avg 2.4 hari</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Menunggu TTD</span>
          <p className="font-display font-black text-2xl text-blue-700">2</p>
          <p className="text-[10px] text-blue-600 font-bold">Kabid BAAK</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Selesai</span>
          <p className="font-display font-black text-2xl text-emerald-700">33</p>
          <p className="text-[10px] text-emerald-600 font-bold">100% terkirim email</p>
        </div>
      </div>

      {/* Template Surat Grid (6 Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>📄</span> Template Surat Resmi Tersedia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <button onClick={() => triggerToast("Membuat Surat Keterangan Aktif Kuliah...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            📜 Surat Aktif Kuliah
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">PDF Auto Generate with QR Code</span>
          </button>
          <button onClick={() => triggerToast("Membuat Surat Izin Cuti Akademik...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            ⏸️ Surat Cuti Akademik
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Persetujuan Kaprodi & Dekan</span>
          </button>
          <button onClick={() => triggerToast("Membuat Surat Pengantar Penelitian...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            🔬 Surat Pengantar Penelitian
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tujuan Perusahaan / Instansi</span>
          </button>
          <button onClick={() => triggerToast("Membuat Surat Rekomendasi Beasiswa...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            🌟 Rekomendasi Beasiswa
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tanda Tangan Dekan / WD 1</span>
          </button>
          <button onClick={() => triggerToast("Membuat Transkrip Nilai Sementara...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            📊 Transkrip Sementara
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Legalisir Digital Stempel BAAK</span>
          </button>
          <button onClick={() => triggerToast("Membuat Surat Bebas Pustaka...")} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#0f487b] hover:bg-blue-50/50 rounded-xl text-left font-bold text-slate-800 transition cursor-pointer">
            📚 Bebas Pustaka
            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Integrasi Perpustakaan UNSIA</span>
          </button>
        </div>
      </div>

      {/* Data Table Request Surat */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Antrean Request Surat Akademik</h3>
          <span className="text-xs font-mono font-bold text-slate-500">7 Pengajuan Menunggu</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID Surat</th>
                <th className="px-4 py-3">Jenis Surat</th>
                <th className="px-4 py-3">Pemohon (Mhs)</th>
                <th className="px-4 py-3">Tujuan Penggunaan</th>
                <th className="px-4 py-3">Tanggal Request</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "SRT-2026-001", type: "Surat Aktif Kuliah", mhs: "26090182 · Budi Santoso", goal: "Syarat BPJS TK Orangtua", date: "28 Jul 2026", status: "Diproses BAAK" },
                { id: "SRT-2026-002", type: "Rekomendasi Beasiswa", mhs: "26090183 · Siti Aminah", goal: "Beasiswa Djarum 2026", date: "27 Jul 2026", status: "Menunggu TTD Dekan" },
                { id: "SRT-2026-003", type: "Pengantar Penelitian", mhs: "25090110 · Ahmad Fauzi", goal: "PT Telkom Indonesia", date: "26 Jul 2026", status: "Selesai (Terkirim)" },
              ].map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{item.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{item.type}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.mhs}</td>
                  <td className="px-4 py-3">{item.goal}</td>
                  <td className="px-4 py-3 font-mono">{item.date}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 font-bold text-[10px] rounded-full ${item.status.includes("Selesai") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => triggerToast(`Memproses & Menerbitkan ${item.id}`)}
                      className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                    >
                      Proses Surat →
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
