"use client";

interface KrsSubmission {
  id: string;
  name: string;
  nim: string;
  sksCount: number;
  courses: string[];
  status?: string;
}

interface KrsValidationTabProps {
  submissions: KrsSubmission[];
  selectedSub: KrsSubmission | null;
  setSelectedSub: (sub: KrsSubmission | null) => void;
  rejectNote: string;
  setRejectNote: (note: string) => void;
  handleKrsApprove: (id: string, name: string) => void;
  handleKrsReject: (id: string, name: string) => void;
}

export default function KrsValidationTab({
  submissions,
  selectedSub,
  setSelectedSub,
  rejectNote,
  setRejectNote,
  handleKrsApprove,
  handleKrsReject,
}: KrsValidationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      {/* Submission List */}
      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
          Daftar Antrean Pengajuan KRS (Terintegrasi Keuangan)
        </h3>
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400 text-sm font-bold">
            ✓ Tidak ada antrean pengajuan KRS saat ini.
          </div>
        ) : (
          submissions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSub(s)}
              className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                selectedSub?.id === s.id
                  ? "border-[#0f487b] bg-blue-50/50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-[#0f487b]/30"
              }`}
            >
              <div>
                <div className="font-bold text-slate-800 text-base">{s.name}</div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{s.nim}</p>
              </div>
              <span className="text-xs bg-[#FED524]/20 text-[#0f487b] font-bold px-2.5 py-1 rounded-lg">
                {s.sksCount} SKS Diajukan
              </span>
            </button>
          ))
        )}
      </div>

      {/* Form Workspace */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
        {selectedSub ? (
          <div className="space-y-5">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Persetujuan KRS
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSub.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSub.nim}</p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500">Mata Kuliah Terpilih</p>
              <ul className="space-y-1.5">
                {selectedSub.courses.map((c, i) => (
                  <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <textarea
                rows={2}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Catatan penolakan (wajib jika ditolak)..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-600"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleKrsReject(selectedSub.id, selectedSub.name)}
                  disabled={!rejectNote}
                  className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all ${
                    rejectNote
                      ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 cursor-pointer"
                      : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  Tolak KRS
                </button>
                <button
                  onClick={() => handleKrsApprove(selectedSub.id, selectedSub.name)}
                  className="py-2.5 rounded-xl font-bold text-xs bg-[#0f487b] text-white border border-[#0f487b] hover:bg-[#00719f] cursor-pointer"
                >
                  Setujui KRS
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold">
            💡 Pilih pendaftar pada daftar antrean untuk meninjau krs mahasiswa.
          </div>
        )}
      </div>
    </div>
  );
}
