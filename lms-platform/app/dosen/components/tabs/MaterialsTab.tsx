"use client";

import { LMSMaterial, LMSSession } from "../page";

interface MaterialsTabProps {
  selectedSession: LMSSession | null;
  materials: LMSMaterial[];
  materialTitle: string;
  setMaterialTitle: (t: string) => void;
  materialType: string;
  setMaterialType: (t: string) => void;
  materialUrl: string;
  setMaterialUrl: (u: string) => void;
  handleCreateMaterial: (e: React.FormEvent) => void;
  verifierRole: "prodi" | "bpm";
  setVerifierRole: (r: "prodi" | "bpm") => void;
  verifyStatus: "setuju" | "revisi";
  setVerifyStatus: (s: "setuju" | "revisi") => void;
  verifyNote: string;
  setVerifyNote: (n: string) => void;
  handleVerifyMaterial: (matId: string) => void;
}

export default function MaterialsTab({
  selectedSession,
  materials,
  materialTitle,
  setMaterialTitle,
  materialType,
  setMaterialType,
  materialUrl,
  setMaterialUrl,
  handleCreateMaterial,
  verifierRole,
  setVerifierRole,
  verifyStatus,
  setVerifyStatus,
  verifyNote,
  setVerifyNote,
  handleVerifyMaterial,
}: MaterialsTabProps) {
  if (!selectedSession) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-bold">
        💡 Pilih sesi pertemuan terlebih dahulu di tab "Sesi Pertemuan".
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Materi & Modul Kuliah (Sesi {selectedSession.sessionNumber}: {selectedSession.topic})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah slide PDF/PPT & tautan video perkuliahan asynchronous.
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          + Upload Materi Perkuliahan Baru
        </h3>
        <form onSubmit={handleCreateMaterial} className="space-y-3">
          <div>
            <label className="block mb-1">Judul Modul / Slide</label>
            <input
              type="text"
              required
              placeholder="Modul Sesi 1: Dasar Pemrograman Web"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Tipe Materi</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="dokumen">Dokumen PDF/PPT</option>
                <option value="video">Video Pembelajaran</option>
                <option value="tugas">Instruksi Tugas</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">URL Berkas / Video</label>
              <input
                type="text"
                required
                placeholder="https://drive.google.com/..."
                value={materialUrl}
                onChange={(e) => setMaterialUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            Upload Materi
          </button>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Daftar Modul & Verifikasi BPM/Prodi</h3>
        <div className="space-y-3">
          {materials.map((m) => (
            <div key={m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{m.title}</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${m.verificationStatus === "setuju" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  ● Status: {m.verificationStatus}
                </span>
              </div>
              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                📄 Open Material File →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
