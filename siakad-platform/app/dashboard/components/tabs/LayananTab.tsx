"use client";

interface LayananTabProps {
  triggerToast: (msg: string) => void;
}

export default function LayananTab({ triggerToast }: LayananTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengajuan Layanan Surat Keterangan Akademik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengajuan Surat Mahasiswa Aktif, Cuti Kuliah, & Surat Pengantar Magang.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Layanan Surat Akademik Online</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 text-sm">Surat Keterangan Mahasiswa Aktif</span>
            <p className="text-slate-500">Keperluan beasiswa, BPJS, atau tunjangan orang tua.</p>
            <button
              onClick={() => triggerToast("Pengajuan Surat Mahasiswa Aktif berhasil dikirim ke BAAK!")}
              className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl cursor-pointer"
            >
              Ajukan Surat →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
