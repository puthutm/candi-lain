"use client";

interface LaporanTabProps {
  triggerToast: (msg: string) => void;
}

export default function LaporanTab({ triggerToast }: LaporanTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
              Analitik & Reporting
            </span>
          </div>
          <h2 className="font-display font-black text-2xl">Laporan Akademik Master</h2>
          <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
            Laporan periodik dan ad-hoc untuk feeder dikti, akreditasi BAN-PT, evaluasi kinerja dosen (EKD), dan eksekutif dashboard management.
          </p>
        </div>
      </div>

      {/* 6 Report Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => triggerToast("Mengekspor Laporan Forlap PDDikti (Feeder XML/JSON)...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">☁️</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Laporan Forlap Dikti</h3>
            <p className="text-xs text-slate-500 mt-1">Sync otomatis ke PDDikti per semester</p>
          </div>
        </button>

        <button
          onClick={() => triggerToast("Mengunduh KHS & Transkrip Massal sebagai PDF ZIP...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">📋</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">KHS & Transkrip Massal</h3>
            <p className="text-xs text-slate-500 mt-1">Generate dokumen per angkatan / prodi</p>
          </div>
        </button>

        <button
          onClick={() => triggerToast("Mengunduh Rekap Distribusi Beban Mengajar Dosen...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">👨‍🏫</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Beban Mengajar Dosen</h3>
            <p className="text-xs text-slate-500 mt-1">Distribusi SKS & jam/minggu 152 Dosen</p>
          </div>
        </button>

        <button
          onClick={() => triggerToast("Mengunduh Laporan EKD (Evaluasi Kinerja Dosen)...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">🏆</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">EKD Dosen</h3>
            <p className="text-xs text-slate-500 mt-1">Evaluasi Kinerja Dosen per semester</p>
          </div>
        </button>

        <button
          onClick={() => triggerToast("Mengunduh Matriks Data 9 Kriteria Akreditasi BAN-PT...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">🎖️</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Akreditasi BAN-PT</h3>
            <p className="text-xs text-slate-500 mt-1">Data 9 kriteria instrumen APS</p>
          </div>
        </button>

        <button
          onClick={() => triggerToast("Mengunduh Daftar Peserta Yudisium Siap Wisuda...")}
          className="bg-white border border-slate-200 hover:border-[#0f487b] hover:shadow-md rounded-2xl p-5 text-left transition duration-150 cursor-pointer space-y-3"
        >
          <span className="text-3xl block">🎓</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Daftar Yudisium</h3>
            <p className="text-xs text-slate-500 mt-1">Mahasiswa siap wisuda & transkrip akhir</p>
          </div>
        </button>
      </div>
    </div>
  );
}
