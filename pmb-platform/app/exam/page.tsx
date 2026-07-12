"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ExamModule {
  id: string;
  name: string;
  durationMinutes: number;
  questionCount: number;
  icon: string;
  status: "available" | "completed" | "ongoing";
}

interface Question {
  id: number;
  text: string;
  options: { key: string; val: string }[];
  correct: string;
}

const MODULES_DATA: ExamModule[] = [
  { id: "tpa", name: "Tes Potensi Akademik", durationMinutes: 60, questionCount: 15, icon: "🧠", status: "available" },
  { id: "tpu", name: "Pengetahuan Umum", durationMinutes: 30, questionCount: 10, icon: "🌍", status: "available" },
  { id: "pkn", name: "Kewarganegaraan", durationMinutes: 20, questionCount: 10, icon: "🇲🇨", status: "available" },
  { id: "ing", name: "Bahasa Inggris", durationMinutes: 45, questionCount: 10, icon: "🗣️", status: "available" },
  { id: "color", name: "Tes Buta Warna", durationMinutes: 5, questionCount: 5, icon: "👁️", status: "available" },
];

const QUESTIONS_TPA: Question[] = [
  {
    id: 1,
    text: "Jika semua burung bertelur, dan angsa adalah burung. Maka Kesimpulannya adalah...",
    options: [
      { key: "A", val: "Angsa tidak bertelur" },
      { key: "B", val: "Angsa bertelur" },
      { key: "C", val: "Angsa kadang-kadang bertelur" },
      { key: "D", val: "Angsa adalah burung air" },
    ],
    correct: "B",
  },
  {
    id: 2,
    text: "Pilihlah sinonim kata dari: EKSPANSI",
    options: [
      { key: "A", val: "Penyusutan" },
      { key: "B", val: "Perluasan" },
      { key: "C", val: "Pembagian" },
      { key: "D", val: "Pertemuan" },
    ],
    correct: "B",
  },
  {
    id: 3,
    text: "1, 3, 6, 10, 15, ... Angka selanjutnya dari deret tersebut adalah...",
    options: [
      { key: "A", val: "20" },
      { key: "B", val: "21" },
      { key: "C", val: "22" },
      { key: "D", val: "25" },
    ],
    correct: "B",
  },
];

const PLATES_COLOR = [
  { id: 1, num: "12", img: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Ishihara_9.png" },
  { id: 2, num: "8", img: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Ishihara_1.png" },
  { id: 3, num: "29", img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ishihara_2.png" },
];

export default function ExamPage() {
  const [view, setView] = useState<"lobby" | "briefing" | "exam_text" | "exam_color">("lobby");
  const [modules, setModules] = useState<ExamModule[]>(MODULES_DATA);
  const [activeModule, setActiveModule] = useState<ExamModule | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [raguStatus, setRaguStatus] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [colorPlateIndex, setColorPlateIndex] = useState(0);
  const [plateTimer, setPlateTimer] = useState(10);
  const plateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // General Timer
  useEffect(() => {
    if ((view === "exam_text" || view === "exam_color") && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishModule();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, timeLeft]);

  // Color plate timer
  useEffect(() => {
    if (view === "exam_color") {
      setPlateTimer(10);
      if (plateTimerRef.current) clearInterval(plateTimerRef.current);

      plateTimerRef.current = setInterval(() => {
        setPlateTimer((prev) => {
          if (prev <= 1) {
            handleColorNext();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (plateTimerRef.current) clearInterval(plateTimerRef.current);
      };
    }
  }, [view, colorPlateIndex]);

  const handleSelectModule = (mod: ExamModule) => {
    if (mod.status === "completed") return;
    setActiveModule(mod);
    setView("briefing");
  };

  const handleStartExam = () => {
    if (!activeModule) return;
    setTimeLeft(activeModule.durationMinutes * 60);

    if (activeModule.id === "color") {
      setColorPlateIndex(0);
      setColorInput("");
      setView("exam_color");
    } else {
      setCurrentQuestionIndex(0);
      setView("exam_text");
    }
  };

  const handleSelectAnswer = (qId: number, key: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: key,
    }));
  };

  const handleToggleRagu = (qId: number) => {
    setRaguStatus((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleColorNext = () => {
    // Save color answer
    setAnswers((prev) => ({
      ...prev,
      [colorPlateIndex + 100]: colorInput, // offset to prevent collisions
    }));
    setColorInput("");

    if (colorPlateIndex < PLATES_COLOR.length - 1) {
      setColorPlateIndex(colorPlateIndex + 1);
    } else {
      if (plateTimerRef.current) clearInterval(plateTimerRef.current);
      handleFinishModule();
    }
  };

  const handleFinishModule = () => {
    if (!activeModule) return;
    setShowConfirmModal(false);

    // Set module status to completed
    setModules((prev) =>
      prev.map((m) => (m.id === activeModule.id ? { ...m, status: "completed" } : m))
    );
    setView("lobby");
    setActiveModule(null);
  };

  const allCompleted = modules.every((m) => m.status === "completed");

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => (v < 10 ? `0${v}` : v)).join(":");
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 antialiased flex flex-col justify-between select-none">
      {/* Header */}
      <header className="h-16 md:h-20 bg-[#0f487b] text-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0f487b] font-bold text-xl">
            📝
          </span>
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl leading-tight">CBT PMB UNSIA</h1>
            <p className="text-[10px] md:text-xs text-blue-100 font-medium tracking-wide uppercase">
              {activeModule ? activeModule.name : "Lobi Ujian Seleksi"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(view === "exam_text" || view === "exam_color") && (
            <div className="flex items-center gap-2 bg-[#0a345c] border border-blue-400/30 px-3 py-1.5 rounded-xl text-yellow-400 font-bold font-mono text-base">
              ⏳ <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <span className="h-8 w-px bg-blue-400/20"></span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white leading-none">Budi Santoso</span>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 overflow-hidden relative min-h-[70vh]">
        {/* VIEW 1: LOBBY */}
        {view === "lobby" && (
          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 lg:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800">
                  Modul Ujian Seleksi
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Kerjakan kelima modul ujian di bawah ini. Anda dapat mengerjakan modul dalam urutan acak, namun
                  setiap modul memiliki batas waktunya masing-masing.
                </p>
              </div>

              {!allCompleted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((m) => {
                    const completed = m.status === "completed";
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectModule(m)}
                        className={`text-left p-6 rounded-2xl border transition-all ${
                          completed
                            ? "bg-emerald-50 border-emerald-200 cursor-not-allowed opacity-80"
                            : "bg-white border-slate-200 hover:border-[#0f487b]/40 hover:shadow-md cursor-pointer"
                        }`}
                      >
                        <span className="text-3xl">{m.icon}</span>
                        <h3 className="font-display text-base font-bold text-slate-800 mt-4">{m.name}</h3>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-slate-100 text-xs">
                          <span className="text-slate-400">{m.durationMinutes} Menit</span>
                          <span
                            className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                              completed ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {completed ? "Selesai" : "Mulai"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Ujian Selesai */
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                    ✓
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-800">Seluruh Ujian Selesai!</h2>
                  <p className="text-slate-600 text-sm">
                    Terima kasih, semua modul telah diselesaikan. Jawaban Anda telah tersimpan secara aman pada server CBT pusat.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f]"
                  >
                    Kembali ke Dashboard Utama
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: BRIEFING */}
        {view === "briefing" && activeModule && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 text-center space-y-6">
              <span className="text-5xl">{activeModule.icon}</span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800">
                Briefing: {activeModule.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 text-sm font-semibold border border-slate-100">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Durasi</span>
                  <span className="text-slate-800 font-bold text-base">{activeModule.durationMinutes} Menit</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Sifat Ujian</span>
                  <span className="text-rose-600 font-bold text-base">Close Book</span>
                </div>
              </div>
              <div className="text-left text-xs text-slate-500 leading-relaxed bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-2">
                <p>💡 <b>Ketentuan Ujian CBT:</b></p>
                <p>1. Pengawasan Ujian dipantau secara berkala. Jawaban akan disimpan secara berkala oleh sistem.</p>
                <p>2. Tidak diperkenankan menutup browser atau membuka tab/aplikasi lain selama ujian berlangsung.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setView("lobby")}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleStartExam}
                  className="flex-2 py-3 bg-[#0f487b] text-white font-bold rounded-xl hover:bg-[#00719f] text-sm shadow-md"
                >
                  Mulai Ujian Sekarang →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: EXAM TEXT (TPA / TPU) */}
        {view === "exam_text" && activeModule && (
          <div className="absolute inset-0 flex flex-col md:flex-row bg-white">
            {/* Left: Questions Panel */}
            <div className="flex-grow flex flex-col justify-between h-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Soal Nomor <span className="text-lg font-extrabold text-[#0f487b]">{currentQuestionIndex + 1}</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Auto-save aktif</span>
              </div>

              {/* Questions Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed mb-6">
                  {QUESTIONS_TPA[currentQuestionIndex]?.text}
                </p>
                <div className="space-y-3">
                  {QUESTIONS_TPA[currentQuestionIndex]?.options.map((opt) => {
                    const isSelected = answers[currentQuestionIndex] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectAnswer(currentQuestionIndex, opt.key)}
                        className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                          isSelected
                            ? "border-[#0f487b] bg-blue-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isSelected ? "bg-[#0f487b] text-white border-[#0f487b]" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-slate-700 font-medium text-sm pt-0.5">{opt.val}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-yellow-700 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 select-none">
                  <input
                    type="checkbox"
                    checked={!!raguStatus[currentQuestionIndex]}
                    onChange={() => handleToggleRagu(currentQuestionIndex)}
                    className="w-4 h-4 rounded text-yellow-500"
                  />
                  Ragu-ragu
                </label>
                {currentQuestionIndex < QUESTIONS_TPA.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    className="px-5 py-2 bg-[#0f487b] text-white font-bold rounded-xl hover:bg-[#00719f] text-xs"
                  >
                    Selanjutnya →
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 text-xs shadow-md"
                  >
                    Selesai Modul ✓
                  </button>
                )}
              </div>
            </div>

            {/* Right: Question Map Grid */}
            <div className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col justify-between shrink-0 h-full hidden md:flex">
              <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daftar Soal</h3>
              </div>
              <div className="flex-1 p-4 grid grid-cols-5 gap-2 overflow-y-auto">
                {QUESTIONS_TPA.map((_, i) => {
                  const answered = answers[i] !== undefined;
                  const active = currentQuestionIndex === i;
                  const ragu = !!raguStatus[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`w-10 h-10 rounded-lg border font-bold text-sm flex items-center justify-center transition-all ${
                        active
                          ? "border-[#0f487b] ring-2 ring-[#0f487b]/20 bg-blue-50 text-[#0f487b]"
                          : ragu
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : answered
                          ? "bg-[#0f487b] text-white border-[#0f487b]"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="p-4 bg-white border-t border-slate-200">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold rounded-xl text-xs"
                >
                  Selesai & Kumpulkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: EXAM COLOR (TES BUTA WARNA ISHIHARA) */}
        {view === "exam_color" && activeModule && (
          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 flex flex-col items-center relative">
              {/* Progress timer bar */}
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                <div
                  className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(plateTimer / 10) * 100}%` }}
                ></div>
              </div>

              <h3 className="font-display text-lg font-bold text-slate-800 mb-4">
                Plat Ishihara Ke-{colorPlateIndex + 1}
              </h3>

              <div className="w-60 h-60 rounded-full border-4 border-slate-100 overflow-hidden mb-6 relative shadow-inner">
                <img
                  src={PLATES_COLOR[colorPlateIndex]?.img}
                  alt="Ishihara Plate"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full max-w-xs space-y-4">
                <input
                  type="number"
                  placeholder="Ketik angka yang Anda lihat..."
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-full text-center text-2xl font-bold py-3 border-2 border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none"
                />
                <button
                  onClick={handleColorNext}
                  className="w-full py-3 bg-[#0f487b] text-white font-bold rounded-xl hover:bg-[#00719f] text-sm"
                >
                  Lanjutkan →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Akhiri Modul Ujian?</h3>
            <p className="text-xs text-slate-500">
              Modul yang diakhiri secara permanen tidak dapat diakses kembali untuk diubah jawabannya. Pastikan Anda telah menjawab semua soal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleFinishModule}
                className="flex-1 py-2.5 bg-[#0f487b] text-white font-bold rounded-lg text-xs"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-10 border-t border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-400">
        &copy; {new Date().getFullYear()} Universitas Siber Asia. All rights reserved.
      </footer>
    </div>
  );
}
export const dynamic = "force-dynamic";
