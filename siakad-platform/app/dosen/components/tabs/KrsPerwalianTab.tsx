"use client";

export interface KrsItemDetail {
  itemId: string;
  itemStatus: string;
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  courseType: string;
}

export interface KrsSubmissionDetail {
  krsId: string;
  studentId: string;
  studentName: string;
  nim: string;
  totalSks: number;
  items: KrsItemDetail[];
}

interface KrsPerwalianTabProps {
  submissions: KrsSubmissionDetail[];
  selectedSub: KrsSubmissionDetail | null;
  setSelectedSub: (sub: KrsSubmissionDetail | null) => void;
  rejectNote: string;
  setRejectNote: (note: string) => void;
  handleKrsApprove: (krsId: string, name: string) => void;
  handleKrsReject: (krsId: string, name: string) => void;
}

export default function KrsPerwalianTab({
  submissions,
  selectedSub,
  setSelectedSub,
  rejectNote,
  setRejectNote,
  handleKrsApprove,
  handleKrsReject,
}: KrsPerwalianTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in pb-10">
      {/* Submission List */}
      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
          Daftar Antrean Pengajuan KRS Perwalian (Mahasiswa Bimbingan)
        </h3>
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400 text-sm font-bold">
            ✓ Tidak ada antrean KRS perwalian yang memerlukan persetujuan.
          </div>
        ) : (
          submissions.map((s) => (
            <button
              key={s.krsId}
              onClick={() => setSelectedSub(s)}
              className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                selectedSub?.krsId === s.krsId
                  ? "border-[#0f487b] bg-blue-50/50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-[#0f487b]/30"
              }`}
            >
              <div>
                <div className="font-bold text-slate-800 text-base">{s.studentName}</div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{s.nim}</p>
              </div>
              <span className="text-xs bg-[#FED524]/20 text-[#0f487b] font-bold px-2.5 py-1 rounded-lg">
                {s.totalSks} SKS Diajukan
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
                Validasi Dosen PA
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSub.studentName}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSub.nim}</p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500">Mata Kuliah Terpilih ({selectedSub.items.length} MK)</p>
              <ul className="space-y-1.5">
                {selectedSub.items.map((c) => (
                  <li key={c.itemId} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between">
                    <span className="font-bold">{c.courseCode} · {c.courseName}</span>
                    <span className="font-mono text-purple-700 font-bold">{c.sks} SKS</span>
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
                  onClick={() => handleKrsReject(selectedSub.krsId, selectedSub.studentName)}
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
                  onClick={() => handleKrsApprove(selectedSub.krsId, selectedSub.studentName)}
                  className="py-2.5 rounded-xl font-bold text-xs bg-[#0f487b] text-white border border-[#0f487b] hover:bg-[#00719f] cursor-pointer"
                >
                  Setujui KRS
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold">
            💡 Pilih mahasiswa pada daftar antrean untuk meninjau KRS perwalian.
          </div>
        )}
      </div>
    </div>
  );
}
