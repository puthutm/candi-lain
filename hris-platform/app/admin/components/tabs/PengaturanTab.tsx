"use client";

interface PengaturanTabProps {
  triggerNotice: (msg: string) => void;
}

export default function PengaturanTab({ triggerNotice }: PengaturanTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengaturan Komponen SDM & Formula PPh21
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi komponen tunjangan, insentif BKD, & aturan BPJS TK/Kesehatan.
          </p>
        </div>
        <button
          onClick={() => triggerNotice("Pengaturan komponen SDM berhasil disimpan!")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          💾 Simpan Pengaturan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Komponen Tunjangan & Insentif BKD
          </h3>
          <div className="space-y-3 font-medium">
            <div>
              <label className="block mb-1">Tunjangan Jabatan Guru Besar (Rp)</label>
              <input type="number" defaultValue={5000000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block mb-1">Tunjangan Lektor Kepala (Rp)</label>
              <input type="number" defaultValue={3000000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block mb-1">Insentif Per Sesi Pertemuan (Rp)</label>
              <input type="number" defaultValue={250000} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Potongan BPJS & Pajak PPh21
          </h3>
          <div className="space-y-3 font-medium">
            <div>
              <label className="block mb-1">Potongan BPJS Kesehatan (%)</label>
              <input type="number" defaultValue={1} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="block mb-1">Potongan BPJS Ketenagakerjaan (%)</label>
              <input type="number" defaultValue={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
