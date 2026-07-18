"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  INSTITUTION_NAME,
  SSO_AUTHORIZE_URL,
  SSO_CLIENT_ID,
  SSO_CALLBACK_URL,
  DEFAULT_APPLICANT_PASSWORD,
} from "@/lib/client-config";

interface GelombangItem {
  id: string;
  name: string;
  period: string;
  quota: string;
  status: "active" | "disabled" | "closed";
}

interface JalurItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  free?: boolean;
  icon: string;
}

interface ProdiItem {
  id: string;
  name: string;
  faculty: string;
  icon: string;
}

const STEPS = [
  { id: 1, label: "Gelombang", sub: "Pilih periode pendaftaran" },
  { id: 2, label: "Jalur", sub: "Tentukan jalur masuk" },
  { id: 3, label: "Program Studi", sub: "Pilih jurusan pilihan" },
  { id: 4, label: "Data Diri", sub: "Lengkapi identitas" },
];


export default function PmbPublikPage() {
  const [step, setStep] = useState(1);
  const [waves, setWaves] = useState<GelombangItem[]>([]);
  const [entryPaths, setEntryPaths] = useState<JalurItem[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<ProdiItem[]>([]);

  const [selGelombang, setSelGelombang] = useState<GelombangItem | null>(null);
  const [selJalur, setSelJalur] = useState<JalurItem | null>(null);
  const [selProdi, setSelProdi] = useState<ProdiItem | null>(null);
  const [dataDiri, setDataDiri] = useState({ name: "", phone: "", email: "", agree: false });
  const [errors, setErrors] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [loadingTaskIndex, setLoadingTaskIndex] = useState(0);
  const [success, setSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const formatIDR = (n: number) =>
    n === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch("/api/meta");
        const json = await res.json();
        if (json.success) {
          // NOTE: ikon/label sebaiknya datang dari API bila tersedia.
          // Saat ini, kita tetap render data meta dari DB tanpa memanggil seed mock dari client.
          setWaves(
            json.waves.map((w: any) => ({
              id: w.id,
              name: w.name,
              period: `${new Date(w.startDate).toLocaleDateString("id-ID")} - ${new Date(w.endDate).toLocaleDateString("id-ID")}`,
              quota: "Kuota tersedia",
              status: w.status === "aktif" ? "active" : "disabled",
            }))
          );

          setEntryPaths(
            json.entryPaths.map((p: any) => ({
              id: p.id,
              name: p.name,
              desc: p.isFree ? "Pembebasan biaya pendaftaran" : "Jalur pendaftaran berbayar",
              price: parseFloat(p.formFee),
              free: p.isFree,
              icon: p.code === "BEAS" ? "🎁" : p.code === "PRES" ? "🏆" : "✨",
            }))
          );

          setStudyPrograms(
            json.studyPrograms.map((p: any) => ({
              id: p.id,
              name: p.name.replace("S1 ", ""),
              faculty: p.faculty === "FTI" ? "Fakultas Sains & Teknologi" : "Fakultas Bisnis",
              icon: p.code === "INF" ? "💻" : p.code === "SI" ? "📊" : "💼",
            }))
          );
        }
      } catch (err) {
        console.error("Gagal load metadata", err);
      }
    }
    loadMetadata();
  }, []);


  useEffect(() => {
    let nameErr = "";
    let phoneErr = "";
    let emailErr = "";
    if (dataDiri.name && dataDiri.name.trim().length < 3) nameErr = "Nama minimal 3 karakter";
    if (dataDiri.phone && dataDiri.phone.replace(/\D/g, "").length < 9) phoneErr = "Nomor WhatsApp minimal 9 digit";
    if (dataDiri.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataDiri.email)) emailErr = "Format email tidak valid";
    setErrors({ name: nameErr, phone: phoneErr, email: emailErr });
  }, [dataDiri.name, dataDiri.phone, dataDiri.email]);

  const canProceed = () => {
    if (step === 1) return !!selGelombang;
    if (step === 2) return !!selJalur;
    if (step === 3) return !!selProdi;
    if (step === 4) {
      return (
        dataDiri.name.trim().length >= 3 &&
        dataDiri.phone.replace(/\D/g, "").length >= 9 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataDiri.email) &&
        dataDiri.agree
      );
    }
    return false;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setLoadingTaskIndex(0);

      // Perform real register API call
      fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: dataDiri.name,
          email: dataDiri.email,
          phone: dataDiri.phone,
          waveId: selGelombang?.id,
          entryPathId: selJalur?.id,
          studyProgramId: selProdi?.id,
          password: DEFAULT_APPLICANT_PASSWORD,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Save candidate ID in localStorage to simulate session
            localStorage.setItem("pmb_applicant_id", data.applicant.id);
            localStorage.setItem("pmb_applicant_name", data.applicant.fullName);
            localStorage.setItem("pmb_applicant_ref", data.applicant.registrationNumber);
            localStorage.setItem("pmb_applicant_stage", data.applicant.currentStage);

            const interval = setInterval(() => {
              setLoadingTaskIndex((prev) => {
                if (prev >= 2) {
                  clearInterval(interval);
                  setTimeout(() => {
                    setLoading(false);
                    setSuccess(true);
                    setRefNumber(data.applicant.registrationNumber);
                    triggerToast("Pendaftaran berhasil disimpan ke database!");
                  }, 700);
                  return 3;
                }
                return prev + 1;
              });
            }, 900);
          } else {
            setLoading(false);
            triggerToast("Error: " + data.error);
          }
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          triggerToast("Gagal menghubungi server");
        });
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSsoLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    document.cookie = `sso_code_verifier=${verifier}; path=/; max-age=600; SameSite=Lax`;

    let authUrl = SSO_AUTHORIZE_URL;
    let cbUrl = SSO_CALLBACK_URL;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1" && authUrl.includes("localhost")) {
        authUrl = authUrl.replace("localhost", host);
      }
      const currentHost = window.location.host;
      cbUrl = `${window.location.protocol}//${currentHost}/api/auth/callback`;
    }

    window.location.href = `${authUrl}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(cbUrl)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(refNumber);
    triggerToast("Nomor referensi disalin");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/applicants/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem("pmb_applicant_id", json.applicant.id);
        localStorage.setItem("pmb_applicant_name", json.applicant.fullName);
        localStorage.setItem("pmb_applicant_ref", json.applicant.registrationNumber);
        localStorage.setItem("pmb_applicant_stage", json.applicant.currentStage);
        triggerToast("Login sukses!");
        setIsLoginOpen(false);
        window.location.href = "/dashboard";
      } else {
        triggerToast(json.error || "Kata sandi salah atau akun tidak terdaftar.");
      }
    } catch (err) {
      triggerToast("Gagal menghubungi server. Coba lagi.");
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
      {/* SIDEBAR */}
      <aside className="lg:col-span-4 xl:col-span-3 relative lg:sticky lg:top-0 lg:h-screen flex flex-col text-white overflow-hidden gradient-blue shrink-0">
        <div className="absolute inset-0 pmb-grid-pattern opacity-50 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col h-full p-6 sm:p-8 lg:p-10 overflow-y-auto dark-scrollbar">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ecc94b] flex items-center justify-center pmb-accent-glow shrink-0 text-[#0f487b] font-bold text-xl">
              🎓
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200/80 font-bold">Portal PMB</div>
              <div className="font-display font-bold text-sm sm:text-base truncate">{INSTITUTION_NAME}</div>
            </div>
          </div>

          <div className="mt-8 lg:mt-12">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#ecc94b]/90 font-bold">
              T.A. {currentYear} / {currentYear + 1}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.2rem] leading-[1.15] font-bold mt-3">
              Daftar jadi <span className="text-[#ecc94b]">mahasiswa baru</span> dalam 4 langkah.
            </h1>
            <p className="text-slate-200/80 text-xs sm:text-sm mt-4 leading-relaxed">
              Pengalaman pendaftaran digital ala enterprise — cepat, aman, dan sepenuhnya online.
            </p>
          </div>

          {/* Desktop progress */}
          <div className="hidden lg:flex flex-col gap-3 mt-10">
            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <button
                  key={s.id}
                  disabled={!isDone}
                  onClick={() => setStep(s.id)}
                  className={`group flex items-start gap-4 text-left rounded-xl px-3 py-2.5 transition-all ${
                    isDone ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isDone
                          ? "bg-[#ecc94b] text-[#0f487b]"
                          : isActive
                          ? "bg-[#ecc94b] text-[#0f487b] pmb-pulse"
                          : "bg-white/5 text-slate-300 border border-white/10"
                      }`}
                    >
                      {isDone ? "✓" : s.id}
                    </div>
                    {idx !== STEPS.length - 1 && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-9 w-px h-7 ${
                          isDone ? "bg-[#ecc94b]/60" : "bg-white/10"
                        }`}
                      ></div>
                    )}
                  </div>
                  <div className="pt-1">
                    <div className={`text-sm font-semibold ${isActive || isDone ? "text-white" : "text-slate-300"}`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-slate-300/70 mt-0.5">{s.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 text-[10px] text-slate-300/70">
            © {currentYear} {INSTITUTION_NAME}.
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="lg:col-span-8 xl:col-span-9 bg-[#f8fafc] relative min-h-screen flex flex-col justify-between">
        {/* Top bar */}
        <div className="sticky top-0 z-30 backdrop-blur-md bg-[#f8fafc]/85 border-b border-slate-200/70 px-4 sm:px-6 md:px-8 lg:px-14 py-4 flex items-center justify-between shrink-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-slate-500 font-semibold">
            {success ? "Selesai" : `Langkah ${step} dari 4`}
          </div>
          <button
            onClick={() => setIsLoginOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-md hover:brightness-110 transition-all gradient-btn"
          >
            <span>Login Kandidat</span>
          </button>
        </div>

        <div className="relative p-5 sm:p-8 lg:p-14 xl:p-20 flex-1 flex flex-col justify-center">
          <div className="absolute top-20 right-0 w-[28rem] h-[28rem] rounded-full bg-yellow-400/10 blur-3xl pointer-events-none -z-0"></div>

          {!success ? (
            <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between">
              {/* Mobile stepper */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                {STEPS.map((s, idx) => {
                  const isActive = step === s.id;
                  const isDone = step > s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                          isActive
                            ? "bg-[#0f487b] text-white"
                            : isDone
                            ? "bg-yellow-400/20 text-[#0f487b]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? "bg-[#ecc94b] text-[#0f487b]"
                              : isDone
                              ? "bg-[#ecc94b] text-[#0f487b]"
                              : "bg-white text-slate-500 border border-slate-200"
                          }`}
                        >
                          {isDone ? "✓" : s.id}
                        </span>
                        <span className="font-medium">{s.label}</span>
                      </div>
                      {idx !== STEPS.length - 1 && (
                        <div className={`w-3 h-px ${isDone ? "bg-[#ecc94b]" : "bg-slate-200"}`}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step Content */}
              <div className="step-anim">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  {STEPS[step - 1]?.label}
                </h2>
                <p className="text-slate-500 mt-2 mb-6 sm:mb-8 text-sm sm:text-base">
                  {STEPS[step - 1]?.sub}
                </p>

                {/* Step 1: Gelombang */}
                {step === 1 && (
                  <div className="space-y-4">
                    {waves.map((g) => {
                      const disabled = g.status !== "active";
                      const isSelected = selGelombang?.id === g.id;
                      return (
                        <button
                          key={g.id}
                          disabled={disabled}
                          onClick={() => setSelGelombang(g)}
                          className={`w-full text-left relative flex items-center gap-5 p-4 sm:p-5 rounded-2xl border transition-all ${
                            disabled
                              ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50/60"
                              : isSelected
                              ? "border-[#ecc94b] bg-yellow-50 shadow-[0_10px_30px_-15px_rgba(236,201,75,.6)]"
                              : "border-slate-200 bg-white hover:border-[#0f487b]/40 hover:shadow-md"
                          }`}
                        >
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? "bg-[#0f487b] text-[#ecc94b]" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            📅
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-display text-base sm:text-lg font-semibold text-slate-900">
                                {g.name}
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  g.status === "active"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : g.status === "disabled"
                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                }`}
                              >
                                {g.status === "active" ? "Aktif" : g.status === "disabled" ? "Belum dibuka" : "Tertutup"}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
                              <span>{g.period}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>{g.quota}</span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? "border-[#ecc94b] bg-[#ecc94b] text-[#0f487b]" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <span className="text-xs font-bold">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 2: Jalur */}
                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entryPaths.map((j) => {
                      const isSelected = selJalur?.id === j.id;
                      return (
                        <button
                          key={j.id}
                          onClick={() => setSelJalur(j)}
                          className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all overflow-hidden ${
                            isSelected
                              ? "border-[#ecc94b] bg-yellow-50 shadow-[0_10px_30px_-15px_rgba(236,201,75,.6)]"
                              : "border-slate-200 bg-white hover:border-[#0f487b]/40 hover:shadow-md"
                          }`}
                        >
                          {j.free && (
                            <div className="absolute top-3 right-3 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-[#ecc94b] text-[#0f487b]">
                              Gratis
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "bg-[#0f487b] text-[#ecc94b]" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span className="text-xl">{j.icon}</span>
                            </div>
                            <div className="flex-1 pr-8">
                              <div className="font-display text-base sm:text-lg font-semibold text-slate-900">
                                {j.name}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{j.desc}</div>
                            </div>
                          </div>
                          <div className="mt-5 pt-4 border-t border-dashed border-slate-200 flex items-end justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                              Biaya pendaftaran
                            </span>
                            <span
                              className={`font-display text-lg sm:text-xl font-bold ${
                                j.free ? "text-emerald-600" : "text-[#0f487b]"
                              }`}
                            >
                              {formatIDR(j.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Program Studi */}
                {step === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {studyPrograms.map((p) => {
                      const isSelected = selProdi?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelProdi(p)}
                          className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
                            isSelected
                              ? "border-[#ecc94b] bg-yellow-50 shadow-[0_10px_30px_-15px_rgba(236,201,75,.6)]"
                              : "border-slate-200 bg-white hover:border-[#0f487b]/40 hover:shadow-md"
                          }`}
                        >
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-[#0f487b] text-[#ecc94b]"
                                : "bg-slate-100 text-slate-600 group-hover:bg-[#0f487b] group-hover:text-[#ecc94b]"
                            }`}
                          >
                            <span className="text-xl">{p.icon}</span>
                          </div>
                          <div className="mt-4">
                            <div className="font-display text-sm sm:text-base font-semibold text-slate-900">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{p.faculty}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#ecc94b] flex items-center justify-center text-xs font-bold text-[#0f487b]">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 4: Data Diri */}
                {step === 4 && (
                  <div className="space-y-5 max-w-2xl">
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                        <span className="text-[11px] text-slate-400">Sesuai dengan ijazah / KTP</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                        <input
                          type="text"
                          placeholder="Mis. Andi Pratama Wijaya"
                          value={dataDiri.name}
                          onChange={(e) => setDataDiri({ ...dataDiri, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0f487b] focus:ring-2 focus:ring-yellow-400/40"
                        />
                      </div>
                      {errors.name && <div className="text-xs text-rose-600 mt-1.5">{errors.name}</div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
                          <span className="text-[11px] text-slate-400">Aktif untuk verifikasi</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📞</span>
                          <input
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={dataDiri.phone}
                            onChange={(e) => setDataDiri({ ...dataDiri, phone: e.target.value.replace(/[^\d+]/g, "") })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0f487b] focus:ring-2 focus:ring-yellow-400/40"
                          />
                        </div>
                        {errors.phone && <div className="text-xs text-rose-600 mt-1.5">{errors.phone}</div>}
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">Email Aktif</label>
                          <span className="text-[11px] text-slate-400">Untuk kredensial SSO</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                          <input
                            type="email"
                            placeholder="nama@email.com"
                            value={dataDiri.email}
                            onChange={(e) => setDataDiri({ ...dataDiri, email: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0f487b] focus:ring-2 focus:ring-yellow-400/40"
                          />
                        </div>
                        {errors.email && <div className="text-xs text-rose-600 mt-1.5">{errors.email}</div>}
                      </div>
                    </div>

                    <label
                      onClick={() => setDataDiri({ ...dataDiri, agree: !dataDiri.agree })}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        dataDiri.agree ? "bg-yellow-50 border-[#ecc94b]" : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          dataDiri.agree ? "bg-[#ecc94b] border-[#ecc94b]" : "bg-white border-slate-300"
                        }`}
                      >
                        {dataDiri.agree && <span className="text-xs text-[#0f487b] font-bold">✓</span>}
                      </div>
                      <div className="text-sm leading-relaxed select-none">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                          Saya menyetujui syarat & ketentuan
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          Saya menyatakan data yang diisi adalah benar dan menyetujui kebijakan privasi serta ketentuan
                          pendaftaran {INSTITUTION_NAME}.
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-12 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-slate-200 shrink-0">
                <button
                  disabled={step === 1}
                  onClick={handlePrev}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Kembali
                </button>
                <button
                  disabled={!canProceed()}
                  onClick={handleNext}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceed()
                      ? "text-white shadow-lg shadow-[#0f487b]/30 hover:brightness-110 gradient-btn cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>{step === 4 ? "Submit Pendaftaran" : "Lanjutkan"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Success screen */
            <div className="min-h-[70vh] flex items-center fade-up relative z-10">
              <div className="w-full max-w-2xl mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(16,185,129,.6)] pop text-white text-3xl font-bold">
                  ✓
                </div>
                <div className="text-center mt-7">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-600 font-semibold">
                    Pendaftaran Berhasil
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
                    Selamat datang, <span className="text-[#0f487b]">{dataDiri.name}</span>!
                  </h2>
                  <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
                    Kami telah mengirimkan detail akun kandidat kamu ke WhatsApp dan email. Silakan masuk ke dashboard
                    menggunakan akun tersebut untuk melanjutkan unggah dokumen, pembayaran, dan menyelesaikan proses
                    pendaftaranmu.
                  </p>
                </div>

                <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">

                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">Nomor Referensi</div>
                      <div className="font-mono text-lg font-semibold text-[#0f487b] mt-0.5">{refNumber}</div>
                    </div>
                    <button
                      onClick={handleCopyRef}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200 text-xs"
                      type="button"
                    >
                      Salin Ref
                    </button>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-slate-400">Gelombang</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{selGelombang?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-slate-400">Jalur</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{selJalur?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-slate-400">Program Studi</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{selProdi?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-slate-400">Email</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{dataDiri.email}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] uppercase tracking-wider text-slate-400">Total Biaya</dt>
                      <dd className="mt-0.5 font-semibold text-[#0f487b]">
                        {formatIDR(selJalur?.price || 0)}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href="/dashboard"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-btn hover:brightness-110 transition-all shadow-lg shadow-[#0f487b]/30"
                  >
                    Buka Dashboard Kandidat →
                  </Link>
                </div>

                <div className="mt-5 text-center">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setStep(1);
                      setSelGelombang(null);
                      setSelJalur(null);
                      setSelProdi(null);
                      setDataDiri({ name: "", phone: "", email: "", agree: false });
                    }}
                    className="text-sm text-slate-500 hover:text-[#0f487b] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Daftar pendaftar lain
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 shrink-0">
          &copy; {currentYear} {INSTITUTION_NAME}. All rights reserved.
        </footer>
      </main>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-[#08294d]/95 backdrop-blur-md flex items-center justify-center p-6 fade-up">
          <div className="absolute inset-0 pmb-grid-pattern opacity-40 pointer-events-none"></div>
          <div className="relative max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur text-white">
            <div className="flex items-center gap-3 text-[#ecc94b] mb-1">
              <span className="animate-spin text-lg">⚙️</span>
              <span className="text-[11px] uppercase tracking-[0.22em] font-semibold">Memproses</span>
            </div>
            <h3 className="font-display text-2xl font-semibold leading-tight">Menyiapkan pendaftaranmu...</h3>
            <p className="text-slate-300/80 text-sm mt-2">Sistem sedang menyinkronkan data ke ERP kampus secara realtime.</p>
            <div className="mt-7 space-y-3">
              {["Verifikasi data pendaftar", "Konfigurasi akun ERP kampus", "Pembuatan kredensial SSO"].map(
                (t, i) => {
                  const done = i < loadingTaskIndex;
                  const active = i === loadingTaskIndex;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        done
                          ? "bg-emerald-500/10 border-emerald-400/30"
                          : active
                          ? "bg-yellow-400/10 border-yellow-400/40"
                          : "bg-white/5 border-white/10 opacity-50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          done
                            ? "bg-emerald-400 text-[#0f487b]"
                            : active
                            ? "bg-[#ecc94b] text-[#0f487b]"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {done ? "✓" : active ? "⏳" : i + 1}
                      </div>
                      <span className={`text-sm ${done || active ? "text-white" : "text-slate-400"}`}>{t}</span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 bg-[#08294d]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pop">
            <div className="relative h-28 overflow-hidden gradient-blue">
              <div className="absolute inset-0 pmb-grid-pattern opacity-40"></div>
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-yellow-400/20 blur-3xl"></div>
              <button
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-all text-xs"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#ecc94b]/90 font-semibold">
                  Portal Kandidat
                </div>
                <div className="font-display text-xl font-bold mt-0.5">Masuk ke Dashboard</div>
              </div>
            </div>
            <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed -mt-1">
                Lanjutkan proses pendaftaran, unggah dokumen, dan pantau status seleksi kamu.
              </p>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Email Terdaftar</label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0f487b] focus:ring-2 focus:ring-yellow-400/40"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Kata Sandi</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0f487b] focus:ring-2 focus:ring-yellow-400/40"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white gradient-btn hover:brightness-110 transition-all shadow-lg shadow-[#0f487b]/30 cursor-pointer"
              >
                Masuk Dashboard
              </button>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold">atau</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
              <button
                type="button"
                onClick={handleSsoLogin}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0f487b] bg-[#0f487b]/10 hover:bg-[#0f487b]/20 transition-all border border-[#0f487b]/10 text-xs text-center cursor-pointer"
              >
                🔑 Masuk dengan SSO Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[60] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
