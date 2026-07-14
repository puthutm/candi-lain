"use client";

import { useRole } from "../context/RoleContext";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  code: string;
  name: string;
}

interface QuestionOption {
  optionLabel: string; // 'A', 'B', 'C', etc
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  courseCode: string;
  topic: string;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  difficultyLevel: string;
  bloomTaxonomy: string;
  verificationStatus: string;
  usageCount: number;
  qualityFlag: string;
  options: {
    id: string;
    optionLabel: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

export default function SoalPage() {
  const { currentRole } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [topic, setTopic] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("pilihan_ganda");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("sedang");
  const [bloomTaxonomy, setBloomTaxonomy] = useState("C1");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Options input state
  const [opts, setOpts] = useState<QuestionOption[]>([
    { optionLabel: "A", optionText: "", isCorrect: false },
    { optionLabel: "B", optionText: "", isCorrect: false },
    { optionLabel: "C", optionText: "", isCorrect: false },
    { optionLabel: "D", optionText: "", isCorrect: false },
    { optionLabel: "E", optionText: "", isCorrect: false },
  ]);

  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = async () => {
    try {
      const courseRes = await fetch("/api/courses");
      const courseData = await courseRes.json();
      if (courseData.success) {
        setCourses(courseData.courses || []);
        if (courseData.courses?.length > 0) {
          setCourseCode(courseData.courses[0].code);
        }
      }

      const qRes = await fetch("/api/soal?status=all");
      const qData = await qRes.json();
      if (qData.success) {
        setQuestions(qData.questions || []);
      }
    } catch (e: any) {
      triggerNotice("Gagal memuat data: " + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...opts];
    updated[index]!.optionText = text;
    setOpts(updated);
  };

  const handleCorrectOptionChange = (index: number) => {
    const updated = opts.map((o, idx) => ({
      ...o,
      isCorrect: idx === index,
    }));
    setOpts(updated);
    setCorrectAnswer(opts[index]!.optionLabel);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !topic || !questionText || !correctAnswer) {
      triggerNotice("Semua field utama wajib diisi", true);
      return;
    }

    if (questionType === "pilihan_ganda") {
      const emptyOpt = opts.some(o => !o.optionText);
      if (emptyOpt) {
        triggerNotice("Silakan lengkapi semua opsi jawaban A-E", true);
        return;
      }
    }

    setSubmitting(true);
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode,
          topic,
          questionText,
          questionType,
          correctAnswer,
          difficultyLevel,
          bloomTaxonomy,
          tags,
          options: questionType === "pilihan_ganda" ? opts : [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Butir soal berhasil ditambahkan & diajukan untuk verifikasi!");
        setShowAddForm(false);
        setQuestionText("");
        setTopic("");
        setTagsInput("");
        setCorrectAnswer("");
        setOpts([
          { optionLabel: "A", optionText: "", isCorrect: false },
          { optionLabel: "B", optionText: "", isCorrect: false },
          { optionLabel: "C", optionText: "", isCorrect: false },
          { optionLabel: "D", optionText: "", isCorrect: false },
          { optionLabel: "E", optionText: "", isCorrect: false },
        ]);
        loadData();
      } else {
        triggerNotice(data.error || "Gagal menyimpan soal", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setSubmitting(false);
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
            <h1 className="text-xl font-extrabold tracking-tight">Bank Soal Terpusat</h1>
            <p className="text-xs text-slate-400 font-medium">Desain, kelola, dan verifikasi butir soal akademik terstandar.</p>
          </div>
        </div>

        {currentRole === "dosen" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
          >
            {showAddForm ? "Batal" : "+ Buat Butir Soal"}
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {showAddForm && (
          <form onSubmit={handleAddQuestion} className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h2 className="text-base font-bold text-white">Buat Butir Soal Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Mata Kuliah</label>
                <select
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Topik / Sub-bahasan</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Objek & Konstruktor"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Jenis Soal</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                >
                  <option value="pilihan_ganda">Pilihan Ganda (A-E)</option>
                  <option value="esai">Esai Mandiri</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Tingkat Kesulitan</label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Taksonomi Bloom</label>
                  <select
                    value={bloomTaxonomy}
                    onChange={(e) => setBloomTaxonomy(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="C1">C1 - Mengingat</option>
                    <option value="C2">C2 - Memahami</option>
                    <option value="C3">C3 - Menerapkan</option>
                    <option value="C4">C4 - Menganalisis</option>
                    <option value="C5">C5 - Mengevaluasi</option>
                    <option value="C6">C6 - Menciptakan</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Teks Butir Soal</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="Ketik deskripsi atau pertanyaan dari butir soal di sini..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Tags (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="e.g. kuis-1, dasar, konstruktor"
                />
              </div>

              {/* Conditionally render option choices input for pilihan ganda */}
              {questionType === "pilihan_ganda" ? (
                <div className="md:col-span-2 space-y-3 p-4 rounded-xl border border-white/10 bg-slate-950/40">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Opsi Jawaban</h3>
                  {opts.map((opt, idx) => (
                    <div key={opt.optionLabel} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectOptionChange(idx)}
                        className="w-4 h-4 text-indigo-600 bg-slate-950 border-white/10 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-400 w-4">{opt.optionLabel}</span>
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Ketik pilihan jawaban ${opt.optionLabel}...`}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Kunci Jawaban Esai</label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    required
                    placeholder="Tulis deskripsi kunci jawaban esai..."
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : "Ajukan Soal"}
              </button>
            </div>
          </form>
        )}

        <section className="space-y-4">
          <h2 className="text-base font-bold">Daftar Butir Soal Terbit & Review</h2>
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Belum ada soal terdaftar. Klik + Buat Butir Soal di atas untuk berkontribusi.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded bg-indigo-500/5">
                        {q.courseCode}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                        {q.questionType.replace("_", " ")}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                        {q.bloomTaxonomy}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        q.difficultyLevel === "mudah" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : q.difficultyLevel === "sedang"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {q.difficultyLevel}
                      </span>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      q.verificationStatus === "terbit" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : q.verificationStatus === "menunggu_bpm" || q.verificationStatus === "menunggu_prodi"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {q.verificationStatus.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-white leading-relaxed">{q.questionText}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-3 pl-4 space-y-1.5 border-l border-slate-800">
                        {q.options.map(opt => (
                          <div key={opt.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                              opt.isCorrect 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : "bg-slate-900 text-slate-500"
                            }`}>
                              {opt.optionLabel}
                            </span>
                            <span className={opt.isCorrect ? "text-slate-200 font-bold" : "text-slate-400"}>
                              {opt.optionText}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.questionType === "esai" && (
                      <p className="text-xs text-slate-400 mt-2 font-semibold">
                        Kunci Jawaban: <span className="text-slate-200 font-bold">{q.correctAnswer}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Dipakai: {q.usageCount} Kali</span>
                    <span>Status Kualitas: {q.qualityFlag.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
