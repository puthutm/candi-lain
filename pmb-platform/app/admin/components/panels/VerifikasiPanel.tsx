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
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

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
        setViewingDoc(null);
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
        setViewingDoc(null);
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
    { title: "Ijazah / SKL Asli SMA/SMK", code: "IJAZAH", filename: "ijazah_lengkap.pdf", size: "1.4 MB", type: "pdf", status: "Terunggah" },
    { title: "Kartu Tanda Penduduk (KTP)", code: "KTP", filename: "ktp_kandidat.jpg", size: "850 KB", type: "image", status: "Terunggah" },
    { title: "Kartu Keluarga (KK)", code: "KK", filename: "kartu_keluarga.pdf", size: "1.1 MB", type: "pdf", status: "Terunggah" },
    { title: "Transkrip Nilai / Rapor", code: "RAPOR", filename: "transkrip_rapor.pdf", size: "2.3 MB", type: "pdf", status: "Terunggah" },
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

      {/* Document Inspection & Preview List Modal */}
      {selectedApplicant && !viewingDoc && (
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
                Daftar Dokumen Persyaratan (Klik 'Pratinjau' untuk melihat fisik berkas):
              </span>

              <div className="space-y-2">
                {sampleDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-400 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
                        {doc.type === "image" ? "🖼️" : "📄"}
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
                        ✓ Terunggah
                      </span>
                      <button
                        onClick={() => {
                          setViewingDoc(doc);
                          setZoomLevel(100);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>👁️</span> View Berkas
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

      {/* Actual Visual Document Viewer Overlay Modal */}
      {selectedApplicant && viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 z-[60] flex flex-col items-center justify-between p-4 sm:p-6 fade-in backdrop-blur-sm">
          {/* Top Viewer Toolbar */}
          <div className="w-full max-w-4xl bg-slate-900/90 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                ← Kembali ke Daftar
              </button>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{viewingDoc.title}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white font-mono rounded uppercase">
                    {viewingDoc.filename.split(".").pop()}
                  </span>
                </h4>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {selectedApplicant.fullName} ({selectedApplicant.registrationNumber})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(60, z - 20))}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer border border-slate-700"
                title="Zoom Out"
              >
                🔍-
              </button>
              <span className="text-xs font-mono text-slate-300 w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(180, z + 20))}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer border border-slate-700"
                title="Zoom In"
              >
                🔍+
              </button>
              <button
                onClick={() => triggerToast(`Mengunduh file ${viewingDoc.filename}...`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>📥</span> Unduh
              </button>
            </div>
          </div>

          {/* Interactive Document Viewer Screen */}
          <div className="flex-1 w-full max-w-4xl my-4 overflow-auto flex items-center justify-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800/80 custom-scrollbar">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
              className="transition-transform duration-200"
            >
              {viewingDoc.code === "KTP" ? (
                /* KTP Visual Preview Canvas */
                <div className="w-[440px] h-[280px] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-2xl border-2 border-white/30 relative overflow-hidden select-none">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30 pointer-events-none"></div>
                  <div className="flex justify-between items-start border-b border-white/30 pb-2 mb-3">
                    <div className="text-center w-full">
                      <h5 className="font-black text-xs uppercase tracking-widest text-slate-900">REPUBLIK INDONESIA</h5>
                      <h6 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">KARTU TANDA PENDUDUK</h6>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 flex flex-col items-center justify-center space-y-1">
                      <div className="w-24 h-32 bg-slate-200 border-2 border-white rounded-lg flex flex-col items-center justify-center text-slate-600 shadow-md">
                        <span className="text-3xl">👤</span>
                        <span className="text-[9px] font-bold mt-1 text-slate-500">PAS FOTO</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-900 font-bold">DKI JAKARTA</span>
                    </div>

                    <div className="col-span-2 space-y-1 text-[11px] text-slate-900 font-semibold leading-tight">
                      <div>
                        <span className="text-[9px] text-slate-700 font-bold block">NIK:</span>
                        <span className="font-mono text-sm font-black text-slate-950">{selectedApplicant.nik || "3171012304950001"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-700 font-bold block">Nama:</span>
                        <span className="font-bold text-slate-950 uppercase">{selectedApplicant.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-700 font-bold block">Tempat/Tgl Lahir:</span>
                        <span>JAKARTA, 15-05-2004</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-700 font-bold block">Jenis Kelamin:</span>
                        <span>LAKI-LAKI</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-700 font-bold block">Alamat:</span>
                        <span>JL. SIBER ASIA NO. 12, JAKARTA SELATAN</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-4 opacity-40 font-mono text-[9px] font-bold text-slate-900 border border-slate-900 p-1 rounded">
                    AUTHENTICATED DOCUMENT
                  </div>
                </div>
              ) : (
                /* PDF Certificate Preview Canvas (Ijazah / SKL / KK / Rapor) */
                <div className="w-[520px] min-h-[680px] bg-white rounded-xl p-8 text-slate-900 shadow-2xl border-4 border-slate-300 relative select-none font-serif">
                  {/* Decorative Border */}
                  <div className="absolute inset-3 border-2 border-amber-600/40 rounded-lg pointer-events-none"></div>

                  <div className="text-center space-y-2 border-b-2 border-slate-800 pb-4 mb-6">
                    <div className="w-12 h-12 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-2xl">
                      🏛️
                    </div>
                    <h5 className="font-bold text-xs uppercase tracking-widest text-slate-800">
                      KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI
                    </h5>
                    <h4 className="font-black text-base uppercase text-slate-900 tracking-tight">
                      {viewingDoc.title}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      Nomor Seri Dokumen: IJZ-2026/FTI/{selectedApplicant.registrationNumber}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-800 font-sans">
                    <p className="text-center italic text-slate-600">
                      Yang bertanda tangan di bawah ini menyatakan bahwa dokumen resmi berikut telah diunggah dan terverifikasi untuk pendaftaran PMB:
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">NAMA LENGKAP:</span>
                        <span className="font-bold text-slate-900">{selectedApplicant.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">NO. REGISTRASI:</span>
                        <span className="font-bold text-blue-700">{selectedApplicant.registrationNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PROGRAM STUDI:</span>
                        <span className="font-bold text-slate-900">{selectedApplicant.studyProgram}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">STATUS FILE:</span>
                        <span className="font-bold text-emerald-700">VERIFIED VALID (100%)</span>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-between items-end text-[11px] font-sans">
                      <div className="text-center space-y-1">
                        <div className="w-16 h-16 border-2 border-emerald-600 text-emerald-700 rounded-full flex flex-col items-center justify-center font-bold text-[9px] uppercase rotate-[-12deg] bg-emerald-50">
                          <span>✓ TERVERIFIKASI</span>
                          <span>BAAK PMB</span>
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-[10px] text-slate-500">Ditetapkan di Jakarta</p>
                        <p className="font-bold text-slate-900">Kepala Bagian Akademik BAAK</p>
                        <div className="h-10"></div>
                        <p className="font-bold underline text-slate-900">Dr. H. Ahmad Fauzi, M.T.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Viewer Action Bar */}
          <div className="w-full max-w-4xl bg-slate-900/90 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
            <span className="text-xs text-slate-400 font-medium">
              Pratinjau fisik dokumen beresolusi tinggi · Status: <strong className="text-emerald-400">Valid</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={loadingId === selectedApplicant.id}
                onClick={() => handleVerifyDocs(selectedApplicant.id, selectedApplicant.fullName)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>✓</span> Setujui Berkas Valid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
