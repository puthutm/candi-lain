"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { INSTITUTION_NAME, INSTITUTION_SHORT_NAME, APP_NAME } from "@/lib/client-config";
import { useRole } from "../../../../context/RoleContext";

interface Annotation {
  id: number;
  x: number;
  y: number;
  note: string;
}

export default function GradingBoard({ params }: { params: Promise<{ id: string; assignId: string }> }) {
  const unwrappedParams = use(params);
  const classId = unwrappedParams.id;
  const sessionId = unwrappedParams.assignId;

  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useRole();
  const studentNim = searchParams.get("studentNim") || user?.username || "26090182";

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Menghubungkan ke SSO...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const [studentName, setStudentName] = useState(user.username === studentNim ? user.name : "Budi Santoso");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Dynamic DB states
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [score, setScore] = useState<string>("85");
  const [feedback, setFeedback] = useState("");
  
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (studentNim === "25090127") setStudentName("Citra Lestari");
    else if (studentNim === "25090129") setStudentName("Dewi Maharani");
    else if (studentNim === "25090130") setStudentName("Eko Putra");
    else if (studentNim === user?.username) setStudentName(user?.name || "Budi Santoso");
    else if (studentNim === "26090182") setStudentName("Budi Santoso");

    fetchSubmissionDetails();
  }, [studentNim, sessionId, user]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const fetchSubmissionDetails = async () => {
    try {
      // 1. Fetch assignment of the session first
      const subRes = await fetch(`/api/assignments/submissions?sessionId=${sessionId}`);
      const subData = await subRes.json();
      if (subData.success && subData.assignment) {
        setAssignment(subData.assignment);
        
        // 2. Fetch specific student submission & annotations
        const gradeRes = await fetch(
          `/api/submissions/grade?assignmentId=${subData.assignment.id}&studentUserId=${studentNim}`
        );
        const gradeData = await gradeRes.json();
        if (gradeData.success) {
          setSubmission(gradeData.submission);
          setScore(gradeData.submission.score || "85");
          setFeedback(gradeData.submission.feedback || "");
          
          // Map DB annotations back to local format
          if (Array.isArray(gradeData.annotations)) {
            const mapped = gradeData.annotations.map((anno: any, index: number) => ({
              id: index + 1,
              x: anno.position?.x || 100,
              y: anno.position?.y || 100,
              note: anno.note || "",
            }));
            setAnnotations(mapped);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      initCanvas();
    }
  };

  useEffect(() => {
    initCanvas();
  }, [annotations, studentName]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw mock homework PDF page backdrop
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fafbfc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mock document grid lines/margins
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 20; i < canvas.height; i += 24) {
      ctx.beginPath();
      ctx.moveTo(20, i);
      ctx.lineTo(canvas.width - 20, i);
      ctx.stroke();
    }

    // Mock student handwritten text
    ctx.font = "italic 16px 'JetBrains Mono', Courier, monospace";
    ctx.fillStyle = "#1e3a8a"; // Dark blue ink
    ctx.fillText(`Nama: ${studentName} (${studentNim})`, 40, 50);
    ctx.fillText("TUGAS MATERI - POKOK PEMROGRAMAN WEB", 40, 90);
    ctx.fillText("Jawaban Soal 1:", 40, 130);
    ctx.fillText(submission?.answerText || "Ini draf pengerjaan tugas oleh mahasiswa.", 40, 165);
    ctx.fillText("Jawaban Soal 2:", 40, 250);
    ctx.fillText("Skema MVC memisahkan Model, View, dan Controller.", 40, 285);
    
    // Draw signature mock
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 340);
    ctx.bezierCurveTo(420, 310, 430, 350, 450, 330);
    ctx.stroke();

    // Redraw markers on canvas
    annotations.forEach((anno: Annotation) => {
      ctx.fillStyle = "#FED524";
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(anno.x, anno.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#004996";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(anno.id), anno.x, anno.y);
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing.current = true;
    startPos.current = { x, y };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pen") {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#dc2626"; // Crimson Red annotation
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    // Create marker at drawing origin
    const newAnnoId = annotations.length + 1;
    const newAnno: Annotation = {
      id: newAnnoId,
      x: startPos.current.x,
      y: startPos.current.y,
      note: "",
    };

    setAnnotations((prev: Annotation[]) => [...prev, newAnno]);
  };

  const handleClear = () => {
    setAnnotations([]);
    triggerToast("Kanvas anotasi berhasil dibersihkan!");
  };

  const handleSubmitGrade = async () => {
    if (!submission) return;
    if (!score || isNaN(Number(score))) {
      triggerToast("Nilai harus berupa angka valid!");
      return;
    }

    try {
      const res = await fetch("/api/submissions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          score: Number(score),
          feedback,
          annotations,
          graderUserId: user.userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Penilaian dan anotasi berhasil disimpan di database!");
        fetchSubmissionDetails();
      }
    } catch (err: any) {
      triggerToast(err.message);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl transition duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">✓</div>
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-md">
              <span className="text-white font-display font-black text-lg">U</span>
            </div>
            <div className="leading-tight">
              <p className="font-display font-black text-slate-900 text-sm">{INSTITUTION_SHORT_NAME} {APP_NAME}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{INSTITUTION_NAME}</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500 font-bold">
            <Link href="/" className="hover:text-[#004996]">Beranda</Link>
            <span>/</span>
            <Link href={`/courses/${classId}`} className="hover:text-[#004996]">Mata Kuliah</Link>
            <span>/</span>
            <span className="text-slate-900">Grading Board</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${classId}`}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition duration-150 text-xs font-bold"
          >
            ← Kembali ke Kelas
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PDF annotation canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-800">{assignment ? assignment.title : "Dokumen Lembar Jawaban"}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{studentName} ({studentNim})</p>
            </div>
            
            {/* Drawing Toolbar */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTool("pen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  tool === "pen" ? "bg-[#004996] text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                ✏️ Pen
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                🗑️ Bersihkan
              </button>
            </div>
          </div>

          {/* Canvas container */}
          <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[500px]">
            <canvas
              ref={canvasRef}
              width={560}
              height={450}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-white shadow-lg cursor-crosshair"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Grade input and comments */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Grade card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Input Penilaian</h3>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai Tugas (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-bold text-slate-800"
                  placeholder="e.g. 85"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Feedback Umum</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full mt-1.5 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004996] text-xs font-semibold"
                  placeholder="Ketik feedback umum Dosen di sini..."
                />
              </div>

              <button
                onClick={handleSubmitGrade}
                className="w-full py-3 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition duration-150"
              >
                💾 Simpan Penilaian & Anotasi
              </button>
            </div>
          </div>

          {/* Annotations note card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Catatan Anotasi ({annotations.length})
            </h3>
            
            <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[45vh] pr-1">
              {annotations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
                  <span className="text-2xl">✏️</span>
                  <p>Klik dan coret pada area berkas lembar jawaban di sebelah kiri untuk meletakkan catatan anotasi.</p>
                </div>
              ) : (
                annotations.map((anno: Annotation) => (
                  <div key={anno.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-[#FED524] text-[#004996] font-bold text-[9px] flex items-center justify-center shrink-0 border border-amber-500">
                      {anno.id}
                    </div>
                    <textarea
                      rows={2}
                      placeholder={`Tambahkan catatan untuk anotasi #${anno.id}...`}
                      value={anno.note}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const targetVal = e.target.value;
                        setAnnotations((prev: Annotation[]) =>
                          prev.map((a: Annotation) => (a.id === anno.id ? { ...a, note: targetVal } : a))
                        );
                      }}
                      className="flex-grow bg-transparent text-[11px] font-semibold focus:outline-none resize-none"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
