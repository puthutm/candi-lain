"use client";

interface KomunikasiPanelProps {
  triggerToast: (msg: string) => void;
}

export default function KomunikasiPanel({ triggerToast }: KomunikasiPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Blast Pesan & Pengumuman PMB (Email & WhatsApp Bot)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kirim pengumuman hasil seleksi, reminder kelengkapan berkas, & info daftar ulang.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Form Broadcasting Pesan</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Penerima</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium">
              <option>Semua Pendaftar Gelombang 1</option>
              <option>Pendaftar Lulus (Belum Daftar Ulang)</option>
              <option>Pendaftar Berkas Belum Verifikasi</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Judul Pengumuman</label>
            <input
              type="text"
              placeholder="Pengumuman Hasil Seleksi PMB Gelombang 1 2026/2027"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Isi Pesan (Support Dynamic Tags: [NAMA], [NO_REG])</label>
            <textarea
              rows={4}
              placeholder="Selamat, [NAMA] dengan No. Reg [NO_REG] dinyatakan DITERIMA di UNSIA..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
            />
          </div>
          <button
            onClick={() => triggerToast("Pesan blast Email & WhatsApp berhasil terkirim ke target pendaftar!")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            📢 Broadcast Pesan Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
