"use client";

export interface LMSSession {
  id: string;
  sessionNumber: number;
  topic: string;
  description: string;
}

export interface LMSMaterial {
  id: string;
  title: string;
  materialType: string;
  fileUrl: string;
}

interface StudentMaterialsTabProps {
  selectedSession: LMSSession | null;
  materials: LMSMaterial[];
  assignmentAnswer: string;
  setAssignmentAnswer: (ans: string) => void;
  submissionStatus: string;
  handleSubmitAssignment: (e: React.FormEvent) => void;
}

export default function StudentMaterialsTab({
  selectedSession,
  materials,
  assignmentAnswer,
  setAssignmentAnswer,
  submissionStatus,
  handleSubmitAssignment,
}: StudentMaterialsTabProps) {
  if (!selectedSession) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-bold">
        💡 Pilih sesi pertemuan terlebih dahulu di tab "Sesi Kuliah".
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Materi & Tugas Kuliah (Sesi {selectedSession.sessionNumber}: {selectedSession.topic})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh slide PDF/PPT & kumpulkan lembar jawaban tugas online.
          </p>
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          📄 Modul Kuliah Unduhan
        </h3>
        <div className="space-y-3">
          {materials.map((m) => (
            <div key={m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-sm">{m.title}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-mono">{m.materialType}</span>
              </div>
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                Unduh PDF →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Submission */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm">📝 pengumpulan Tugas Sesi</h3>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${submissionStatus === "sudah_dikirim" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {submissionStatus.replace("_", " ")}
          </span>
        </div>
        <form onSubmit={handleSubmitAssignment} className="space-y-3">
          <div>
            <label className="block mb-1">Jawaban / Tautan Tugas (Google Drive / GitHub)</label>
            <textarea
              rows={3}
              required
              placeholder="https://github.com/..."
              value={assignmentAnswer}
              onChange={(e) => setAssignmentAnswer(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            Kirim Jawaban Tugas
          </button>
        </form>
      </div>
    </div>
  );
}
