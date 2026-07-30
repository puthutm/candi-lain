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
  const [zoomLevel, setZoomLevel] = useState(100);

  // Per-document status states: { "IJAZAH": "valid", "KTP": "revisi", ... }
  const [docStatuses, setDocStatuses] = useState<{ [code: string]: "valid" | "revisi" | "pending" }>({
    IJAZAH: "valid",
    KTP: "valid",
    KK: "valid",
    RAPOR: "valid",
  });

  const [docNotes, setDocNotes] = useState<{ [code: string]: string }>({
    IJAZAH: "",
    KTP: "",
    KK: "",
    RAPOR: "",
  });

  const toggleDocStatus = (code: string, status: "valid" | "revisi") => {
    setDocStatuses((prev) => ({ ...prev, [code]: status }));
  };

  const setDocNote = (code: string, note: string) => {
    setDocNotes((prev) => ({ ...prev, [code]: note }));
  };

  const handleSaveDecision = async () => {
    if (!selectedApplicant) return;

    const rejectedDocs = Object.entries(docStatuses).filter(([_, status]) => status === "revisi");
    const hasRejections = rejectedDocs.length > 0;

    try {
      setLoadingId(selectedApplicant.id);
      if (hasRejections) {
        // Collect notes for rejected documents
        const notesSummary = rejectedDocs
          .map(([code]) => {
            const title = sampleDocuments.find((d) => d.code === code)?.title || code;
            const note = docNotes[code] || "Dokumen belum sesuai / perlu diunggah ulang";
            return `${title}: ${note}`;
          })
          .join(" | ");

        const res = await fetch("/api/admin/applicants/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantId: selectedApplicant.id,
            currentStage: "unggah_berkas",
            note: notesSummary,
          }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Catatan revisi (${rejectedDocs.length} berkas ditolak) berhasil dikirim ke ${selectedApplicant.fullName}!`);
          setSelectedApplicant(null);
          setViewingDoc(null);
          if (refreshData) refreshData();
        } else {
          triggerToast("Gagal mengirim revisi: " + data.error);
        }
      } else {
        // Approve all documents
        const res = await fetch("/api/admin/applicants/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicantId: selectedApplicant.id, currentStage: "siap_ujian" }),
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Semua berkas ${selectedApplicant.fullName} diterima (Status: Siap Ujian)!`);
          setSelectedApplicant(null);
          setViewingDoc(null);
          if (refreshData) refreshData();
        } else {
          triggerToast("Gagal menyetujui berkas: " + data.error);
        }
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const sampleDocuments = [
    { title: "Ijazah / SKL Asli SMA/SMK", code: "IJAZAH", filename: "ijazah_lengkap.pdf", size: "1.4 MB", type: "pdf" },
    { title: "Kartu Tanda Penduduk (KTP)", code: "KTP", filename: "ktp_kandidat.jpg", size: "850 KB", type: "image" },
    { title: "Kartu Keluarga (KK)", code: "KK", filename: "kartu_keluarga.pdf", size: "1.1 MB", type: "pdf" },
    { title: "Transkrip Nilai / Rapor", code: "RAPOR", filename: "transkrip_rapor.pdf", size: "2.3 MB", type: "pdf" },
  ];

  const rejectedCount = Object.values(docStatuses).filter((s) => s === "revisi").length;
  const validCount = Object.values(docStatuses).filter((s) => s === "valid").length;

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Workspace Verifikasi Berkas Persyaratan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validasi per berkas (Terima / Tolak) & pratinjau dokumen pendaftaran. {unverifiedDocsCount} pendaftar menunggu verifikasi.
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
                    onClick={() => {
                      setSelectedApplicant(a);
                      setDocStatuses({ IJAZAH: "valid", KTP: "valid", KK: "valid", RAPOR: "valid" });
                      setDocNotes({ IJAZAH: "", KTP: "", KK: "", RAPOR: "" });
                    }}
                    className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>👁️</span> Pratinjau & Verifikasi per Berkas →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Inspection & Per-Document Decision Modal */}
      {selectedApplicant && !viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {selectedApplicant.registrationNumber}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">
                  Verifikasi Berkas Per Dokumen: {selectedApplicant.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">PROGRAM STUDI & JALUR:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.studyProgram} · {selectedApplicant.entryPath}</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                  {validCount} Berkas Diterima
                </span>
                {rejectedCount > 0 && (
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg">
                    {rejectedCount} Berkas Ditolak
                  </span>
                )}
              </div>
            </div>

            {/* Document List with Per-Document Accept/Reject Buttons */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 text-xs block">
                Pilih Keputusan (Terima / Tolak) untuk Setiap Dokumen:
              </span>

              <div className="space-y-3">
                {sampleDocuments.map((doc) => {
                  const status = docStatuses[doc.code] || "valid";
                  const isRejected = status === "revisi";

                  return (
                    <div
                      key={doc.code}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isRejected ? "bg-rose-50/60 border-rose-200" : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${isRejected ? "bg-rose-100 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                            {doc.type === "image" ? "🖼️" : "📄"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{doc.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.filename} · {doc.size}
                            </span>
                          </div>
                        </div>

                        {/* Per-Document Toggle Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewingDoc(doc);
                              setZoomLevel(100);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] cursor-pointer"
                          >
                            👁️ View
                          </button>

                          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                            <button
                              onClick={() => toggleDocStatus(doc.code, "valid")}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                !isRejected
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-emerald-700"
                              }`}
                            >
                              ✓ Terima
                            </button>
                            <button
                              onClick={() => toggleDocStatus(doc.code, "revisi")}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                isRejected
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-rose-700"
                              }`}
                            >
                              ✕ Tolak
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Per-Document Revision Input when Rejected */}
                      {isRejected && (
                        <div className="mt-2.5 pt-2.5 border-t border-rose-200/60 fade-in space-y-1">
                          <label className="text-[10px] font-bold text-rose-800 block">
                            Alasan Penolakan {doc.title}:
                          </label>
                          <input
                            type="text"
                            value={docNotes[doc.code] || ""}
                            onChange={(e) => setDocNote(doc.code, e.target.value)}
                            placeholder="Misal: Foto buram / halaman ijazah belum lengkap"
                            className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-600 text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Summary */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                disabled={loadingId === selectedApplicant.id}
                onClick={handleSaveDecision}
                className={`px-5 py-2 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all ${
                  rejectedCount > 0
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {loadingId === selectedApplicant.id
                  ? "Memproses..."
                  : rejectedCount > 0
                  ? `⚠️ Kirim Revisi (${rejectedCount} Berkas Ditolak)`
                  : "✓ Setujui Semua Berkas Diterima (Siap Ujian)"}
              </button>
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

            {/* Per-Document Toggle inside Viewer Toolbar */}
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  onClick={() => toggleDocStatus(viewingDoc.code, "valid")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    docStatuses[viewingDoc.code] !== "revisi"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-emerald-400"
                  }`}
                >
                  ✓ Terima
                </button>
                <button
                  onClick={() => toggleDocStatus(viewingDoc.code, "revisi")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    docStatuses[viewingDoc.code] === "revisi"
                      ? "bg-rose-600 text-white"
                      : "text-slate-400 hover:text-rose-400"
                  }`}
                >
                  ✕ Tolak
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(60, z - 20))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer border border-slate-700"
                  title="Zoom Out"
                >
                  🔍-
                </button>
                <span className="text-xs font-mono text-slate-300 w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(180, z + 20))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer border border-slate-700"
                  title="Zoom In"
                >
                  🔍+
                </button>
              </div>
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
                </div>
              ) : (
                /* PDF Certificate Preview Canvas */
                <div className="w-[520px] min-h-[680px] bg-white rounded-xl p-8 text-slate-900 shadow-2xl border-4 border-slate-300 relative select-none font-serif">
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
                      Dokumen resmi berikut telah diunggah dan diverifikasi untuk pendaftaran PMB:
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
                        <span className="text-slate-500">KEPUTUSAN BERKAS:</span>
                        <span className={`font-bold ${docStatuses[viewingDoc.code] === "revisi" ? "text-rose-700" : "text-emerald-700"}`}>
                          {docStatuses[viewingDoc.code] === "revisi" ? "✕ DITOLAK (PERLU REVISI)" : "✓ DITERIMA (VALID)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Viewer Action Bar */}
          <div className="w-full max-w-4xl bg-slate-900/90 text-white p-3 rounded-2xl border border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
            <span className="text-xs text-slate-400">
              Status Berkas Ini:{" "}
              <strong className={docStatuses[viewingDoc.code] === "revisi" ? "text-rose-400" : "text-emerald-400"}>
                {docStatuses[viewingDoc.code] === "revisi" ? "✕ Ditolak (Perlu Revisi)" : "✓ Diterima (Valid)"}
              </strong>
            </span>
            <button
              onClick={() => setViewingDoc(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Simpan & Kembali ke Daftar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
