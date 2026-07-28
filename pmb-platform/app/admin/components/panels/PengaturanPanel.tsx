"use client";

interface PengaturanPanelProps {
  triggerToast: (msg: string) => void;
}

export default function PengaturanPanel({ triggerToast }: PengaturanPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengaturan Biaya & Parameter Penerimaan PMB
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi tarif formulir per jalur masuk & kredensial password default pendaftar.
          </p>
        </div>
        <button
          onClick={() => triggerToast("Pengaturan biaya PMB berhasil disimpan ke database!")}
          className="px-4 py-2 bg-[#0f487b] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          💾 Simpan Pengaturan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Tarif Formulir Pendaftaran Per Jalur
          </h3>
          <div className="space-y-3 font-medium">
            <div>
              <label className="block mb-1">Jalur Reguler Raport (Rp)</label>
              <input type="number" defaultValue={350000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block mb-1">Jalur Ujian CBT Online (Rp)</label>
              <input type="number" defaultValue={350000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block mb-1">Jalur Beasiswa Unggulan (Rp)</label>
              <input type="number" defaultValue={250000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Kredensial Password Default Akun Pendaftar
          </h3>
          <div className="space-y-3 font-medium">
            <div>
              <label className="block mb-1">Default Password Akun Baru</label>
              <input type="text" defaultValue="Pmb2026!" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-[#0f487b]" />
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              Setiap pendaftar baru yang didaftarkan oleh admin BAAK akan diberikan password default di atas dan diminta menggantinya saat login pertama kali.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
