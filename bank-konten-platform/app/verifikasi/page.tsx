"use client";

import { useRole } from "../context/RoleContext";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Material {
  id: string;
  title: string;
  courseCode: string;
  topic: string;
  materialType: string;
  verificationStatus: string;
  currentVersionNumber: number;
  currentVersion?: {
    fileUrl: string;
  };
}

interface Question {
  id: string;
  courseCode: string;
  topic: string;
  questionText: string;
  questionType: string;
  difficultyLevel: string;
  verificationStatus: string;
}

export default function VerifikasiPage() {
  const { currentRole } = useRole();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [activeTab, setActiveTab] = useState<"materi" | "soal">("materi");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = async () => {
    try {
      const matRes = await fetch("/api/materi?status=all");
      const matData = await matRes.json();
      if (matData.success) {
        // Filter those needing review based on currentRole
        // verifikator_prodi reviews status = "menunggu_prodi"
        // verifikator_bpm reviews status = "menunggu_bpm"
        const filtered = (matData.materials || []).filter((m: any) => {
          if (currentRole === "verifikator_prodi") return m.verificationStatus === "menunggu_prodi";
          if (currentRole === "verifikator_bpm") return m.verificationStatus === "menunggu_bpm";
          return m.verificationStatus !== "terbit" && m.verificationStatus !== "arsip"; // admin views all
        });
        setMaterials(filtered);
      }

      const qRes = await fetch("/api/soal?status=all");
      const qData = await qRes.json();
      if (qData.success) {
        const filtered = (qData.questions || []).filter((q: any) => {
          if (currentRole === "verifikator_prodi") return q.verificationStatus === "menunggu_prodi";
          if (currentRole === "verifikator_bpm") return q.verificationStatus === "menunggu_bpm";
          return q.verificationStatus !== "terbit" && q.verificationStatus !== "arsip";
        });
        setQuestions(filtered);
      }
    } catch (e: any) {
      triggerNotice("Gagal memuat antrean: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole]);

  const handleDecision = async (contentType: "materi" | "soal", contentId: string, decision: "setuju" | "revisi") => {
    setProcessing(true);
    const stage = currentRole === "verifikator_bpm" ? "bpm" : "prodi";

    try {
      const res = await fetch("/api/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          stage,
          decision,
          note,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice(decision === "setuju" ? "Konten berhasil disetujui!" : "Konten dikembalikan untuk direvisi.");
        setSelectedId(null);
        setNote("");
        loadData();
      } else {
        triggerNotice(data.error || "Gagal memproses verifikasi", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {notice && (
        <div className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
          isError 
            ? "bg-rose-950/90 border-rose-800 text-rose-200" 
            : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{isError ? "⚠️" : "💡"}</span>
            <p className="text-xs font-bold tracking-wide">{notice}</p>
          </div>
        </div>
      )}

      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-sm font-bold text-white transition">
            &larr;
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Portal Verifikasi Berjenjang</h1>
            <p className="text-xs text-slate-400 font-medium">Validasi penjaminan mutu konten akademik sebelum diterbitkan.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Verifikator:</span>
          <span className="text-xs font-bold text-indigo-400 px-2 uppercase tracking-wide">
            {currentRole.replace("_", " ")}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => { setActiveTab("materi"); setSelectedId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "materi" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Antrean Materi ({materials.length})
          </button>
          <button
            onClick={() => { setActiveTab("soal"); setSelectedId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "soal" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Antrean Soal ({questions.length})
          </button>
        </div>

        {/* Note Editor Overlay if item selected */}
        {selectedId && (
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tulis Catatan / Justifikasi Ulasan</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Berikan alasan penyetujuan atau catatan revisi..."
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedId(null)}
                className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-[10px] font-bold text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDecision(activeTab, selectedId, "revisi")}
                disabled={processing}
                className="rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 px-3 py-1.5 text-[10px] font-bold transition cursor-pointer"
              >
                Kembalikan (Revisi)
              </button>
              <button
                onClick={() => handleDecision(activeTab, selectedId, "setuju")}
                disabled={processing}
                className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-[10px] font-bold text-white transition cursor-pointer"
              >
                Setujui & Terbitkan
              </button>
            </div>
          </div>
        )}

        {/* Content list representation */}
        {activeTab === "materi" ? (
          <div className="space-y-4">
            {materials.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Tidak ada materi menunggu ulasan Anda.</div>
            ) : (
              materials.map((mat) => (
                <div key={mat.id} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex justify-between items-center gap-4">
                  <div>
                    <span className="text-[9px] font-bold font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20">{mat.courseCode}</span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{mat.title}</h3>
                    <p className="text-xs text-slate-400">Topik: {mat.topic} &bull; Tipe: {mat.materialType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {mat.currentVersion?.fileUrl && (
                      <a href={mat.currentVersion.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10px] font-semibold rounded-lg text-slate-200">
                        Lihat Berkas
                      </a>
                    )}
                    <button
                      onClick={() => { setSelectedId(mat.id); setNote(""); }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold rounded-lg text-white cursor-pointer"
                    >
                      Beri Ulasan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Tidak ada butir soal menunggu ulasan Anda.</div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex justify-between items-center gap-4">
                  <div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[9px] font-bold font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20">{q.courseCode}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">{q.questionType}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-2 line-clamp-1">{q.questionText}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Topik: {q.topic} &bull; Kesulitan: {q.difficultyLevel}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedId(q.id); setNote(""); }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold rounded-lg text-white cursor-pointer"
                  >
                    Beri Ulasan
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
