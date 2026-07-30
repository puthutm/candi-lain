"use client";

import { useState } from "react";

interface VerifikasiPanelProps {
  applicants: any[];
  unverifiedDocsCount: number;
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
}

export default function VerifikasiPanel({
  applicants,
  unverifiedDocsCount,
  triggerToast,
  refreshData,
}: VerifikasiPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const handleVerifyDocs = async (applicantId: string, fullName: string) => {
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, currentStage: "siap_ujian" }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Berkas pendaftaran ${fullName} berhasil diverifikasi (Status: Siap Ujian)!`);
        setSelectedApplicant(null);
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal verifikasi berkas: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequestRevision = async (applicantId: string, fullName: string) => {
    if (!revisionNote) {
      triggerToast("Mohon isi catatan revisi berkas!");
      return;
    }
    try {
      setLoadingId(applicantId);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, currentStage: "unggah_berkas", note: revisionNote }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Catatan revisi berkas telah dikirimkan ke pendaftar ${fullName}.`);
        setSelectedApplicant(null);
        setShowRevisionForm(false);
        setRevisionNote("");
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal meminta revisi: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const sampleDocuments = [
    { title: "Ijazah / SKL Asli SMA/SMK", code: "IJAZAH", filename: "ijazah_lengkap.pdf", size: "1.4 MB", status: "Terunggah" },
    { title: "Kartu Tanda Penduduk (KTP)", code: "KTP", filename: "ktp_kandidat.jpg", size: "850 KB", status: "Terunggah" },
    { title: "Kartu Keluarga (KK)", code: "KK", filename: "kartu_keluarga.pdf", size: "1.1 MB", status: "Terunggah" },
    { title: "Transkrip Nilai / Rapor", code: "RAPOR", filename: "transkrip_rapor.pdf", size: "2.3 MB", status: "Terunggah" },
  ];

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Workspace Verifikasi Berkas Persyaratan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validasi & pratinjau dokumen pendaftaran (Ijazah, KTP, KK, & Transkrip). {unverifiedDocsCount} pendaftar menunggu verifikasi.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">
          Antrean Dokumen Menunggu Verifikasi BAAK
        </h3>
        <div className="space-y-3 text-xs">
          {applicants.map((a) => {
            const isVerified = a.currentStage === "siap_ujian" || a.currentStage === "diterima";
            return (
              <div
                key={a.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/80 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{a.fullName}</span>
                    <span
                      className={`px-2 py-0.5 font-bold rounded-full text-[10px] ${
                        isVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isVerified ? "✓ Terverifikasi" : "Menunggu Verifikasi"}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                    {a.registrationNumber} · {a.studyProgram} · {a.entryPath}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-full text-[10px]">
                    4 Berkas Lengkap
                  </span>
                  <button
                    onClick={() => setSelectedApplicant(a)}
                    className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>👁️</span> Pratinjau & Verifikasi →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Inspection & Preview Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {selectedApplicant.registrationNumber}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">
                  Verifikasi Berkas: {selectedApplicant.fullName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedApplicant(null);
                  setShowRevisionForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">PROGRAM STUDI:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.studyProgram}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">JALUR PMB:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.entryPath}</span>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 text-xs block">
                Daftar Dokumen Persyaratan yang Diunggah:
              </span>

              <div className="space-y-2">
                {sampleDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        📄
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.filename} · {doc.size}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        ✓ Valid
                      </span>
                      <button
                        onClick={() => triggerToast(`Membuka pratinjau dokumen ${doc.title}...`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] cursor-pointer"
                      >
                        Pratinjau
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revision Note Form */}
            {showRevisionForm && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 fade-in">
                <label className="font-bold text-amber-900 block text-xs">Catatan Catatan Revisi untuk Kandidat:</label>
                <textarea
                  rows={2}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Contoh: File Ijazah buram / KTP belum sesuai..."
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:border-amber-600 font-medium"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRevisionForm(false)}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    disabled={loadingId === selectedApplicant.id}
                    onClick={() => handleRequestRevision(selectedApplicant.id, selectedApplicant.fullName)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                  >
                    Kirim Catatan Revisi
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowRevisionForm(!showRevisionForm)}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 cursor-pointer"
              >
                ⚠️ Minta Revisi Berkas
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  disabled={loadingId === selectedApplicant.id}
                  onClick={() => handleVerifyDocs(selectedApplicant.id, selectedApplicant.fullName)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {loadingId === selectedApplicant.id ? "Memverifikasi..." : "✓ Verifikasi & Setujui Berkas Valid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
