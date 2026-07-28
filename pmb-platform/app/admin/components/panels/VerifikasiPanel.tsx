"use client";

interface VerifikasiPanelProps {
  applicants: any[];
  unverifiedDocsCount: number;
  triggerToast: (msg: string) => void;
}

export default function VerifikasiPanel({
  applicants,
  unverifiedDocsCount,
  triggerToast,
}: VerifikasiPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Workspace Verifikasi Berkas Persyaratan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validasi dokumen pendaftaran (Ijazah, KTP, KK, & Transkrip). {unverifiedDocsCount} dokumen menunggu verifikasi.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">
          Antrean Dokumen Menunggu Verifikasi BAAK
        </h3>
        <div className="space-y-3 text-xs">
          {applicants.map((a) => (
            <div
              key={a.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800 text-sm">{a.fullName}</span>
                <span className="block text-[11px] text-slate-500 font-mono">
                  {a.registrationNumber} · {a.studyProgram}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                  {a.docsCount || 3} Berkas Diunggah
                </span>
                <button
                  onClick={() => triggerToast(`Memeriksa berkas milik ${a.fullName}`)}
                  className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Periksa Berkas →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
