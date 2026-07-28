"use client";

interface PengaturanTabProps {
  triggerToast: (msg: string) => void;
}

export default function PengaturanTab({ triggerToast }: PengaturanTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pengaturan Parameter Akademik SIAKAD</h2>
          <p className="text-xs text-slate-500 mt-0.5">Konfigurasi Format NIM, Bobot Nilai, Kehadiran LMS, Syarat Kelulusan, & Batas SKS.</p>
        </div>
        <button
          onClick={() => triggerToast("Seluruh pengaturan parameter akademik berhasil disimpan dan diterapkan!")}
          className="px-4 py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
        >
          💾 Simpan Pengaturan
        </button>
      </div>

      {/* 4 Interactive Setting Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Module 1: Format Generator NIM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="text-lg">🔢</span>
            <div>
              <h3 className="font-bold text-slate-800">Format Generator NIM Otomatis</h3>
              <p className="text-[11px] text-slate-500">Prefix tahun, kode prodi, & nomor urut pendaftaran</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pola Format NIM (Template Tag)</label>
              <input
                type="text"
                defaultValue="[YY][KODE_PRODI][NO_URUT_4DIGIT]"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-[#0f487b]"
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">Preview Contoh NIM Generasi 2026:</span>
              <span className="font-mono font-bold text-sm text-[#0f487b]">26090182</span>
              <span className="text-[11px] text-slate-600 block mt-0.5">(26 = Tahun 2026, 09 = S1 Informatika, 0182 = Urut Mhs)</span>
            </div>
          </div>
        </div>

        {/* Module 2: Formula Bobot Penilaian */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="text-lg">📊</span>
            <div>
              <h3 className="font-bold text-slate-800">Formula & Bobot Evaluasi Nilai KHS</h3>
              <p className="text-[11px] text-slate-500">Persentase kontribusi komponen nilai ke Nilai Akhir (100%)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 font-medium">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Bobot Tugas (%)</label>
              <input type="number" defaultValue={20} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Bobot Kuis (%)</label>
              <input type="number" defaultValue={10} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Bobot UTS (%)</label>
              <input type="number" defaultValue={30} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Bobot UAS (%)</label>
              <input type="number" defaultValue={40} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
            </div>
          </div>
        </div>

        {/* Module 3: Syarat Kehadiran LMS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="text-lg">⏱️</span>
            <div>
              <h3 className="font-bold text-slate-800">Aturan Kehadiran Perkuliahan LMS</h3>
              <p className="text-[11px] text-slate-500">Batas minimum kehadiran mahasiswa untuk mengikuti UAS</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Minimal Kehadiran (%)</label>
              <input type="number" defaultValue={75} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700" />
            </div>
            <p className="text-[11px] text-slate-500">
              Mahasiswa dengan kehadiran di bawah 75% otomatis ter-blokir dari ujian UAS online di portal LMS.
            </p>
          </div>
        </div>

        {/* Module 4: Batas Maksimal SKS KRS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="text-lg">🛡️</span>
            <div>
              <h3 className="font-bold text-slate-800">Batas SKS Maksimal Pengambilan KRS</h3>
              <p className="text-[11px] text-slate-500">Penentuan jatah SKS berdasarkan IPK semester lalu</p>
            </div>
          </div>
          <div className="space-y-2 font-medium">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span>IPK {">="} 3.00</span>
              <span className="font-mono font-bold text-[#0f487b]">Maksimal 24 SKS</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span>IPK 2.50 – 2.99</span>
              <span className="font-mono font-bold text-[#0f487b]">Maksimal 21 SKS</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span>IPK {"<"} 2.50</span>
              <span className="font-mono font-bold text-[#0f487b]">Maksimal 18 SKS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
