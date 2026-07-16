"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  INSTITUTION_NAME,
  PAYMENT_BANKS,
} from "@/lib/client-config";

type TabType = "dashboard" | "tagihan" | "data" | "ujian" | "pengumuman";

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "processing" | "paid">("unpaid");
  const [selectedVa, setSelectedVa] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});
  const [showUjianReady, setShowUjianReady] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRef, setCandidateRef] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [currentStage, setCurrentStage] = useState("");

  // Dynamic applicant properties
  const [prodiName, setProdiName] = useState("");
  const [entryPathName, setEntryPathName] = useState("");
  const [formFee, setFormFee] = useState(0);
  const [invoice, setInvoice] = useState<any>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Biodata form states
  const [nik, setNik] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("L");
  const [isProfileSubmitted, setIsProfileSubmitted] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Extensive form fields from cikal bakal biodata HTML
  const [addressLine, setAddressLine] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kota, setKota] = useState("");
  const [provincesData, setProvincesData] = useState<Record<string, string[]>>({});
  const [kecamatan, setKecamatan] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kodePos, setKodePos] = useState("");
  const [domisiliSamaKtp, setDomisiliSamaKtp] = useState(false);
  const [religion, setReligion] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [citizenship, setCitizenship] = useState("WNI");
  const [maritalStatus, setMaritalStatus] = useState("Belum Kawin");
  const [jacketSize, setJacketSize] = useState("");
  const [jobStatus, setJobStatus] = useState("Tidak Bekerja");
  const [income, setIncome] = useState("");
  const [vehicle, setVehicle] = useState("Tidak Memiliki Kendaraan");
  const [pjjDevice, setPjjDevice] = useState("");
  const [prevEduLevel, setPrevEduLevel] = useState("");
  const [prevSchoolName, setPrevSchoolName] = useState("");
  const [prevSchoolNpsn, setPrevSchoolNpsn] = useState("");
  const [prevNisnNim, setPrevNisnNim] = useState("");
  const [prevGradYear, setPrevGradYear] = useState("");
  const [prevAvgScore, setPrevAvgScore] = useState("");
  const [fatherNik, setFatherNik] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [fatherEdu, setFatherEdu] = useState("");
  const [fatherJob, setFatherJob] = useState("");
  const [fatherIncome, setFatherIncome] = useState("");
  const [motherNik, setMotherNik] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherEdu, setMotherEdu] = useState("");
  const [motherJobState, setMotherJobState] = useState("");
  const [dependentsCount, setDependentsCount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const formatIDR = (n: number) =>
    n === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const fetchInvoiceDetails = (appId: string) => {
    fetch(`/api/invoices?applicantId=${appId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.invoices && data.invoices.length > 0) {
          setInvoice(data.invoices[0]);
        }
      })
      .catch((err) => console.error("Error fetching invoice:", err));
  };

  const fetchMeta = () => {
    fetch("/api/meta")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProvincesData(data.regions || {});
        }
      })
      .catch((err) => console.error("Error fetching meta:", err));
  };

  const fetchApplicantDetails = (appId: string) => {
    fetch(`/api/applicants/${appId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCandidateName(data.applicant.fullName);
          setCandidateRef(data.applicant.registrationNumber);
          setCurrentStage(data.applicant.currentStage);
          setProdiName(data.applicant.studyProgramName || "");
          setEntryPathName(data.applicant.entryPathName || "");
          setFormFee(parseFloat(data.applicant.entryPathFee || "0"));

          if (data.applicant.paymentStatus === "lunas") {
            setPaymentStatus("paid");
          } else {
            setPaymentStatus("unpaid");
          }
          if (data.applicant.currentStage === "siap_ujian" || data.applicant.currentStage === "selesai_ujian" || data.applicant.currentStage === "diterima" || data.applicant.currentStage === "tidak_lulus") {
            setShowUjianReady(true);
          }
          // Map documents uploaded
          const files: { [key: string]: string } = {};
          data.documents.forEach((d: any) => {
            if (d.status === "terverifikasi" || d.status === "menunggu_verifikasi") {
              files[d.documentTypeId] = d.fileUrl;
            }
          });
          setUploadedFiles(files);

          // Populate profile if present
          if (data.profile) {
            setNik(data.profile.nik || "");
            setBirthPlace(data.profile.birthPlace || "");
            const rawDate = data.profile.birthDate || "";
            setBirthDate(rawDate ? rawDate.split("T")[0] : "");
            setGender(data.profile.gender || "L");
            
            const rawAddress = data.profile.address || "";
            if (rawAddress.startsWith("{")) {
              try {
                const parsed = JSON.parse(rawAddress);
                setAddressLine(parsed.addressLine || "");
                setProvinsi(parsed.provinsi || "");
                setKota(parsed.kota || "");
                setKecamatan(parsed.kecamatan || "");
                setKelurahan(parsed.kelurahan || "");
                setKodePos(parsed.kodePos || "");
                setDomisiliSamaKtp(!!parsed.domisiliSamaKtp);
                setReligion(parsed.religion || "");
                setBloodType(parsed.bloodType || "");
                setCitizenship(parsed.citizenship || "WNI");
                setMaritalStatus(parsed.maritalStatus || "Belum Kawin");
                setJacketSize(parsed.jacketSize || "");
                setJobStatus(parsed.jobStatus || "Tidak Bekerja");
                setIncome(parsed.income || "");
                setVehicle(parsed.vehicle || "Tidak Memiliki Kendaraan");
                setPjjDevice(parsed.pjjDevice || "");
                setPrevEduLevel(parsed.prevEduLevel || "");
                setPrevSchoolName(parsed.prevSchoolName || "");
                setPrevSchoolNpsn(parsed.prevSchoolNpsn || "");
                setPrevNisnNim(parsed.prevNisnNim || "");
                setPrevGradYear(parsed.prevGradYear || "");
                setPrevAvgScore(parsed.prevAvgScore || "");
                setFatherNik(parsed.fatherNik || "");
                setFatherName(parsed.fatherName || "");
                setFatherEdu(parsed.fatherEdu || "");
                setFatherJob(parsed.fatherJob || "");
                setFatherIncome(parsed.fatherIncome || "");
                setMotherNik(parsed.motherNik || "");
                setMotherName(parsed.motherName || "");
                setMotherEdu(parsed.motherEdu || "");
                setMotherJobState(parsed.motherJob || "");
                setDependentsCount(parsed.dependentsCount || "");
                setBankName(parsed.bankName || "");
                setBankAccountName(parsed.bankAccountName || "");
                setBankAccountNumber(parsed.bankAccountNumber || "");
              } catch (e) {
                setAddressLine(rawAddress);
              }
            } else {
              setAddressLine(rawAddress);
            }
            setIsProfileSubmitted(true);
          }

          // Trigger invoice fetch
          fetchInvoiceDetails(appId);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSaveProfile = () => {
    if (!candidateId) {
      triggerToast("Sesi tidak ditemukan, silakan login ulang.");
      return;
    }
    if (!nik || !birthPlace || !birthDate || !addressLine || !motherName) {
      triggerToast("Kolom NIK, Tempat/Tanggal Lahir, Alamat KTP, dan Nama Ibu Kandung wajib diisi.");
      return;
    }

    const serializedAddress = JSON.stringify({
      addressLine,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      kodePos,
      domisiliSamaKtp,
      religion,
      bloodType,
      citizenship,
      maritalStatus,
      jacketSize,
      jobStatus,
      income,
      vehicle,
      pjjDevice,
      prevEduLevel,
      prevSchoolName,
      prevSchoolNpsn,
      prevNisnNim,
      prevGradYear,
      prevAvgScore,
      fatherNik,
      fatherName,
      fatherEdu,
      fatherJob,
      fatherIncome,
      motherNik,
      motherName,
      motherEdu,
      motherJob: motherJobState,
      dependentsCount,
      bankName,
      bankAccountName,
      bankAccountNumber
    });

    setSubmittingProfile(true);
    fetch("/api/applicants/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantId: candidateId,
        nik,
        birthPlace,
        birthDate,
        gender,
        address: serializedAddress,
        parentName: motherName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsProfileSubmitted(true);
          triggerToast("Biodata berhasil disimpan!");
          fetchApplicantDetails(candidateId);
        } else {
          triggerToast("Gagal: " + data.error);
        }
      })
      .catch(() => triggerToast("Gagal menghubungi server"))
      .finally(() => setSubmittingProfile(false));
  };

  const handleSimulatePayment = () => {
    if (!candidateId || !invoice) return;
    setSubmittingPayment(true);
    fetch("/api/invoices/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId: candidateId, invoiceId: invoice.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          triggerToast("Simulasi pembayaran sukses! Status pendaftaran diperbarui.");
          setPaymentStatus("paid");
          fetchApplicantDetails(candidateId);
        } else {
          triggerToast("Gagal: " + data.error);
        }
      })
      .catch(() => triggerToast("Gagal menghubungi server"))
      .finally(() => setSubmittingPayment(false));
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.success && data.authenticated && data.user && data.user.role === "applicant") {
          setCandidateId(data.user.userId);
          fetchApplicantDetails(data.user.userId);
          fetchMeta();
        } else {
          window.location.href = "/";
        }
      } catch (err) {
        window.location.href = "/";
      }
    };
    checkSession();
  }, []);

  const steps = [
    { label: "Buat Akun", status: "completed", desc: "Registrasi data dasar & akun" },
    {
      label: "Bayar Tagihan",
      status: paymentStatus === "paid" ? "completed" : "current",
      desc: paymentStatus === "paid" ? "Tagihan lunas" : "Konfirmasi pembayaran formulir",
    },
    {
      label: "Data & Berkas",
      status:
        paymentStatus === "paid"
          ? Object.keys(uploadedFiles).length > 0 && Object.keys(uploadedFiles).length >= 4
            ? "completed"
            : "current"
          : "upcoming",
      desc: "Unggah dokumen pendukung",
    },
    {
      label: "Ujian CBT",
      status: Object.keys(uploadedFiles).length >= 4 ? "current" : "upcoming",
      desc: "Mengikuti ujian modul tertulis",
    },
    { label: "Hasil Akhir", status: "upcoming", desc: "Surat kelulusan & NIM" },
  ];


  const handleFileUpload = (docCode: string) => {
    if (!candidateId) {
      setUploadedFiles((prev) => ({
        ...prev,
        [docCode]: "terunggah.pdf",
      }));
      if (Object.keys(uploadedFiles).length === 3) {
        setShowUjianReady(true);
      }
      return;
    }

    fetch("/api/applicants/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantId: candidateId,
        documentCode: docCode,
        fileUrl: `${docCode.toLowerCase()}_terunggah.pdf`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUploadedFiles((prev) => ({
            ...prev,
            [data.document.documentTypeId]: data.document.fileUrl,
          }));
          triggerToast(`Berkas ${docCode} berhasil diunggah!`);
          
          // Re-fetch progress
          fetch(`/api/applicants/${candidateId}`)
            .then(res => res.json())
            .then(resData => {
              if (resData.success && resData.applicant.currentStage === "unggah_berkas") {
                triggerToast("Semua berkas selesai terunggah.");
              }
            });
        } else {
          triggerToast("Gagal: " + data.error);
        }
      })
      .catch(() => triggerToast("Gagal menghubungi server"));
  };

  const currentYear = new Date().getFullYear();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#00719f] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#ecc94b] flex items-center justify-center font-bold text-[#0f487b]">
              PMB
            </span>
            <span className="text-white font-bold tracking-tight text-sm">Dashboard Pendaftar</span>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#ecc94b] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
                {candidateName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "BS"}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0f487b] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white truncate text-sm">{candidateName}</h3>
              <p className="text-[10px] text-[#ecc94b] font-bold mt-0.5 tracking-wider uppercase font-mono">
                {candidateRef}
              </p>
            </div>
          </div>

          <div className="mt-4 px-3 py-2 bg-white/10 border border-white/5 rounded-lg flex items-center gap-2">
            <span className="text-white/70">🎧</span>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Direferensikan Oleh Agen</p>
              <p className="text-[11px] font-semibold text-white truncate">—</p>
            </div>
          </div>

        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Menu Seleksi</p>

          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "dashboard"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Beranda Pendaftar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tagihan");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              activeTab === "tagihan"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>💵</span>
            <span>Daftar Tagihan</span>
            {paymentStatus === "unpaid" && (
              <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            disabled={paymentStatus !== "paid"}
            onClick={() => {
              setActiveTab("data");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              paymentStatus !== "paid"
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "data"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📁</span>
            <span>Lengkapi Berkas</span>
            {paymentStatus !== "paid" && <span className="ml-auto text-xs">🔒</span>}
          </button>

          <button
            disabled={!showUjianReady && Object.keys(uploadedFiles).length < 4}
            onClick={() => {
              setActiveTab("ujian");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              (!showUjianReady && Object.keys(uploadedFiles).length < 4)
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "ujian"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📝</span>
            <span>Ujian Seleksi (CBT)</span>
            {!showUjianReady && Object.keys(uploadedFiles).length < 4 && <span className="ml-auto text-xs">🔒</span>}
          </button>

          <button
            disabled={currentStage !== "diterima" && currentStage !== "tidak_lulus"}
            onClick={() => {
              setActiveTab("pengumuman");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              currentStage !== "diterima" && currentStage !== "tidak_lulus"
                ? "text-white/40 opacity-50 cursor-not-allowed"
                : activeTab === "pengumuman"
                ? "bg-white/15 text-white font-bold border border-white/20"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>📢</span>
            <span>Pengumuman Akhir</span>
            {currentStage !== "diterima" && currentStage !== "tidak_lulus" && <span className="ml-auto text-xs">🔒</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/15 text-rose-300 font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all text-xs border border-rose-500/20"
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-[#0f487b] transition-colors p-2 -ml-2 rounded-lg lg:hidden"
            >
              ☰
            </button>
            <div className="flex flex-col border-l border-slate-200 pl-4">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                {activeTab === "dashboard" ? "DASHBOARD PENDAFTARAN" : null}
                {activeTab === "tagihan" ? "DAFTAR TAGIHAN" : null}
                {activeTab === "data" ? "LENGKAPI BERKAS" : null}
                {activeTab === "ujian" ? "UJIAN SELEKSI CBT" : null}
                {activeTab === "pengumuman" ? "PENGUMUMAN AKHIR" : null}
              </h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                T.A {currentYear}/{currentYear + 1} Ganjil
              </p>
            </div>

          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{candidateName}</span>
            <span className="h-8 w-px bg-slate-200"></span>
            <span className="text-slate-500 hover:text-[#0f487b] cursor-pointer">🔔</span>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 fade-in">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0f487b] to-[#00719f] rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-xl text-white">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    {paymentStatus === "paid" ? "Status: Menunggu Unggah Berkas" : "Aksi Diperlukan: Pembayaran"}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">
                    Selamat datang, {candidateName.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-slate-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    {paymentStatus === "paid"
                      ? "Pembayaran Anda telah lunas. Silakan lengkapi berkas persyaratan administrasi Anda pada tab 'Lengkapi Berkas'."
                      : "Anda telah terdaftar melalui agen Mitra Edukasi Jakarta. Untuk melanjutkan ke tahap pengisian berkas pendaftaran dan ujian CBT, silakan selesaikan pembayaran biaya formulir terlebih dahulu."}
                  </p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Alur Seleksi PMB</h2>
                <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex md:flex-col items-center md:items-center gap-4 md:gap-2 flex-1">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border transition-all ${
                          st.status === "completed"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : st.status === "current"
                            ? "bg-[#0f487b] text-white border-[#0f487b] ring-4 ring-[#0f487b]/10"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {st.status === "completed" ? "✓" : idx + 1}
                      </div>
                      <div className="text-left md:text-center">
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{st.label}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tagihan Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-[#0f487b] text-2xl font-bold">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{prodiName || "S1 Informatika"}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{INSTITUTION_NAME}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-bold">
                        Online
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded font-bold">
                        PJJ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 text-sm border-t border-b md:border-none py-3 md:py-0 w-full md:w-auto">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jalur Seleksi</p>
                    <p className="font-bold text-slate-700 mt-0.5">{entryPathName || "Reguler"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biaya Tagihan</p>
                    <p className="font-bold text-slate-700 mt-0.5">{formatIDR(formFee)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                    <p
                      className={`font-bold mt-0.5 ${
                        paymentStatus === "paid" ? "text-emerald-600" : "text-rose-500 animate-pulse"
                      }`}
                    >
                      {paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}
                    </p>
                  </div>
                </div>

                {paymentStatus !== "paid" && (
                  <button
                    onClick={() => setActiveTab("tagihan")}
                    className="px-5 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all whitespace-nowrap shadow-md cursor-pointer"
                  >
                    Bayar Sekarang →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TAGIHAN */}
          {activeTab === "tagihan" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Pembayaran Formulir Pendaftaran</h2>
              {paymentStatus === "paid" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <span className="text-emerald-500 text-3xl">✓</span>
                  <h3 className="font-bold text-slate-800 mt-2">Pembayaran Formulir Lunas</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Terima kasih, tagihan Anda telah terverifikasi secara instan. Silakan lanjutkan pengisian berkas.
                  </p>
                  <button
                    onClick={() => setActiveTab("data")}
                    className="mt-4 px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all cursor-pointer"
                  >
                    Lengkapi Berkas Pendaftaran
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Bank Selection */}
                  <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Pilih Virtual Account</h3>
                    <div className="space-y-2">
                      {PAYMENT_BANKS.map((va) => {
                        const isSelected = selectedVa === va;
                        return (
                          <button
                            key={va}
                            onClick={() => setSelectedVa(va)}
                            className={`w-full p-4 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                              isSelected ? "border-[#0f487b] bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-semibold text-slate-700 text-sm">{va}</span>
                            <span className="text-xs text-slate-400">Verifikasi Instan</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Biaya Formulir</span>
                      <span className="font-bold text-[#0f487b]">{formatIDR(formFee)}</span>
                    </div>

                    <button
                      disabled={!selectedVa || submittingPayment}
                      onClick={handleSimulatePayment}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all text-sm shadow-md cursor-pointer ${
                        selectedVa
                          ? "bg-emerald-600 hover:bg-emerald-505"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      {submittingPayment
                        ? "Memproses Pembayaran..."
                        : selectedVa
                        ? `Bayar via ${selectedVa} (Simulasi)`
                        : "Pilih Virtual Account Terlebih Dahulu"}
                    </button>

                  </div>

                  {/* Right Column: Invoice Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 h-fit space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Tagihan</h3>
                    <div>
                      <p className="text-xs text-slate-400">Nomor Invoice</p>
                      <p className="font-mono text-sm font-bold text-slate-800">{invoice?.invoiceNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Deskripsi</p>
                      <p className="text-xs text-slate-600 font-semibold">
                        {invoice?.invoiceType === "formulir" ? "Biaya Formulir Pendaftaran PMB" : "Daftar Ulang"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Jatuh Tempo</p>
                      <p className="text-xs text-slate-600 font-semibold">
                        {invoice?.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATA & BERKAS */}
          {activeTab === "data" && (
            <div className="max-w-4xl mx-auto space-y-6 fade-in">
              <h2 className="text-xl font-bold text-slate-800">Data Diri & Dokumen Persyaratan</h2>
              <p className="text-sm text-slate-500 -mt-4">
                Lengkapi biodata Anda, lalu unggah salinan dokumen dalam format PDF atau JPG (maks. 2MB).
              </p>

              {/* Biodata Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Biodata Pendaftar</h3>
                  {isProfileSubmitted && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      ✓ Tersimpan
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {/* 1. Identitas Diri */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      👤 Identitas Diri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          NIK (Nomor Induk Kependudukan)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          value={nik}
                          onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                          placeholder="16 digit NIK"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={candidateName}
                          disabled
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          placeholder="Kota kelahiran"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Jenis Kelamin
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Agama
                        </label>
                        <select
                          value={religion}
                          onChange={(e) => setReligion(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="Islam">Islam</option>
                          <option value="Kristen Protestan">Kristen Protestan</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Golongan Darah
                        </label>
                        <select
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kewarganegaraan
                        </label>
                        <select
                          value={citizenship}
                          onChange={(e) => setCitizenship(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="WNI">WNI</option>
                          <option value="WNA">WNA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Status Pernikahan
                        </label>
                        <select
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="Belum Kawin">Belum Kawin</option>
                          <option value="Kawin">Kawin</option>
                          <option value="Cerai Hidup">Cerai Hidup</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Ukuran Jaket Almamater
                        </label>
                        <select
                          value={jacketSize}
                          onChange={(e) => setJacketSize(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                          <option value="XXXL">XXXL</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Alamat & Tempat Tinggal */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      📍 Alamat & Tempat Tinggal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Jalan / Dusun / RT / RW (Sesuai KTP)
                        </label>
                        <textarea
                          rows={2}
                          value={addressLine}
                          onChange={(e) => setAddressLine(e.target.value)}
                          placeholder="Jalan, RT/RW, Dusun"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Provinsi
                        </label>
                        <select
                          value={provinsi}
                          onChange={(e) => {
                            setProvinsi(e.target.value);
                            setKota("");
                          }}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih Provinsi</option>
                          {Object.keys(provincesData).map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kota / Kabupaten
                        </label>
                        <select
                          value={kota}
                          onChange={(e) => setKota(e.target.value)}
                          disabled={!provinsi}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {provinsi ? "Pilih Kota/Kab" : "Pilih Provinsi Terlebih Dahulu"}
                          </option>
                          {provinsi &&
                            (provincesData[provinsi] || []).map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kecamatan
                        </label>
                        <input
                          type="text"
                          value={kecamatan}
                          onChange={(e) => setKecamatan(e.target.value)}
                          placeholder="Kecamatan"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kelurahan / Desa
                        </label>
                        <input
                          type="text"
                          value={kelurahan}
                          onChange={(e) => setKelurahan(e.target.value)}
                          placeholder="Kelurahan/Desa"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={kodePos}
                          onChange={(e) => setKodePos(e.target.value)}
                          placeholder="Kode Pos"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={domisiliSamaKtp}
                            onChange={(e) => setDomisiliSamaKtp(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0f487b] focus:ring-[#0f487b]/20"
                          />
                          <span className="text-xs text-slate-600 font-medium">Domisili sama dengan KTP</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 3. Profil Pekerjaan & Fasilitas */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      💼 Profil Pekerjaan & Fasilitas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Status Pekerjaan
                        </label>
                        <select
                          value={jobStatus}
                          onChange={(e) => setJobStatus(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="PNS">PNS / TNI / POLRI</option>
                          <option value="Wiraswasta">Wiraswasta / Freelancer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Penghasilan Pribadi (Per Bulan)
                        </label>
                        <select
                          value={income}
                          onChange={(e) => setIncome(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="Tidak Ada">Tidak Ada</option>
                          <option value="< Rp 3.000.000">&lt; Rp 3.000.000</option>
                          <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                          <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Kendaraan Pribadi
                        </label>
                        <select
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="Tidak Memiliki Kendaraan">Tidak Memiliki Kendaraan</option>
                          <option value="Sepeda Motor">Sepeda Motor</option>
                          <option value="Mobil Pribadi">Mobil Pribadi</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Perangkat Utama Belajar PJJ
                        </label>
                        <select
                          value={pjjDevice}
                          onChange={(e) => setPjjDevice(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="Laptop Pribadi">Laptop Pribadi</option>
                          <option value="PC Desktop Pribadi">PC Desktop Pribadi</option>
                          <option value="Smartphone / Tablet">Smartphone / Tablet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Data Pendidikan Asal */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      🎓 Data Pendidikan Asal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Tingkat Pendidikan Terakhir
                        </label>
                        <select
                          value={prevEduLevel}
                          onChange={(e) => setPrevEduLevel(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="SMA/SMK Sederajat">SMA/SMK Sederajat</option>
                          <option value="D3">D3</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Sekolah / PT Asal
                        </label>
                        <input
                          type="text"
                          value={prevSchoolName}
                          onChange={(e) => setPrevSchoolName(e.target.value)}
                          placeholder="Nama Sekolah/Lembaga Asal"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          NPSN / Kode PT Asal
                        </label>
                        <input
                          type="text"
                          value={prevSchoolNpsn}
                          onChange={(e) => setPrevSchoolNpsn(e.target.value)}
                          placeholder="NPSN Sekolah Asal"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          NISN / NIM Asal
                        </label>
                        <input
                          type="text"
                          value={prevNisnNim}
                          onChange={(e) => setPrevNisnNim(e.target.value)}
                          placeholder="NISN atau NIM asal"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Tahun Lulus
                          </label>
                          <input
                            type="number"
                            value={prevGradYear}
                            onChange={(e) => setPrevGradYear(e.target.value)}
                            placeholder="YYYY"
                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Rata-rata Nilai
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={prevAvgScore}
                            onChange={(e) => setPrevAvgScore(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Data Orang Tua / Wali */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      👥 Data Orang Tua / Wali
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Ayah */}
                      <div className="md:col-span-3 border-b border-slate-200 pb-1 mt-1 font-bold text-slate-700">Data Ayah</div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          NIK Ayah
                        </label>
                        <input
                          type="text"
                          value={fatherNik}
                          onChange={(e) => setFatherNik(e.target.value)}
                          placeholder="NIK Ayah"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Lengkap Ayah
                        </label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="Nama lengkap ayah"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Pendidikan Terakhir Ayah
                        </label>
                        <select
                          value={fatherEdu}
                          onChange={(e) => setFatherEdu(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="SD/SMP/SMA">SD/SMP/SMA</option>
                          <option value="Sarjana/Diploma">Sarjana/Diploma</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Pekerjaan Ayah
                        </label>
                        <input
                          type="text"
                          value={fatherJob}
                          onChange={(e) => setFatherJob(e.target.value)}
                          placeholder="Pekerjaan ayah"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Penghasilan Ayah
                        </label>
                        <select
                          value={fatherIncome}
                          onChange={(e) => setFatherIncome(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="< Rp 2.000.000">&lt; Rp 2.000.000</option>
                          <option value="Rp 2M - Rp 5M">Rp 2M - Rp 5M</option>
                          <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                      </div>

                      {/* Ibu */}
                      <div className="md:col-span-3 border-b border-slate-200 pb-1 mt-4 font-bold text-slate-700">Data Ibu Kandung</div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          NIK Ibu
                        </label>
                        <input
                          type="text"
                          value={motherNik}
                          onChange={(e) => setMotherNik(e.target.value)}
                          placeholder="NIK Ibu"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Ibu Kandung
                        </label>
                        <input
                          type="text"
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          placeholder="Nama lengkap ibu kandung"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Pendidikan Terakhir Ibu
                        </label>
                        <select
                          value={motherEdu}
                          onChange={(e) => setMotherEdu(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        >
                          <option value="">Pilih</option>
                          <option value="SD/SMP/SMA">SD/SMP/SMA</option>
                          <option value="Sarjana/Diploma">Sarjana/Diploma</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Pekerjaan Ibu
                        </label>
                        <input
                          type="text"
                          value={motherJobState}
                          onChange={(e) => setMotherJobState(e.target.value)}
                          placeholder="Pekerjaan ibu"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Jumlah Tanggungan Orang Tua
                        </label>
                        <input
                          type="number"
                          value={dependentsCount}
                          onChange={(e) => setDependentsCount(e.target.value)}
                          placeholder="Jumlah tanggungan"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. Data Keuangan & Rekening Pribadi */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <h4 className="font-bold text-[#0f487b] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      💳 Data Keuangan & Rekening Pribadi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="BCA, Mandiri, BRI dll"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nama Pemegang Rekening
                        </label>
                        <input
                          type="text"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="Sesuai buku tabungan"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Nomor rekening bank"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-[#0f487b] focus:outline-none focus:ring-2 focus:ring-[#0f487b]/10 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={submittingProfile}
                    className="px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submittingProfile ? "Menyimpan..." : isProfileSubmitted ? "Perbarui Biodata" : "Simpan Biodata"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dokumen diambil dari data applicant (server), bukan hard-code */}
                {(() => {
                  const docKeys = Object.keys(uploadedFiles);
                  if (docKeys.length === 0) {
                    return (
                      <div className="col-span-full bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-400">
                        Dokumen belum tersedia.
                      </div>
                    );
                  }

                  return docKeys.map((docCode) => (
                    <div
                      key={docCode}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{docCode.toUpperCase()}</h4>
                        <p className="text-xs text-slate-400 mt-1">Wajib Diunggah</p>
                      </div>
                      <div className="flex items-center justify-between">
                        {uploadedFiles[docCode] ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                            <span>✓</span>
                            <span>{uploadedFiles[docCode]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Belum diunggah</span>
                        )}
                        <button
                          onClick={() => handleFileUpload(docCode)}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            uploadedFiles[docCode]
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-[#0f487b] text-white hover:bg-[#00719f]"
                          }`}
                        >
                          {uploadedFiles[docCode] ? "Ganti File" : "Unggah Berkas"}
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>


              {Object.keys(uploadedFiles).length === 4 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-blue-900 font-semibold text-center sm:text-left">
                    💡 Semua berkas selesai diunggah. Silakan klik lanjutkan untuk mengaktifkan tes seleksi CBT.
                  </div>
                  <button
                    onClick={() => setActiveTab("ujian")}
                    className="px-6 py-2.5 bg-[#0f487b] text-white text-xs font-bold rounded-xl hover:bg-[#00719f] transition-all shrink-0 shadow"
                  >
                    Lanjutkan ke Ujian CBT →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UJIAN */}
          {activeTab === "ujian" && (
            <div className="max-w-3xl mx-auto text-center space-y-6 fade-in py-10">
              <span className="text-5xl">📝</span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-800">
                Sistem Seleksi CBT Online
              </h2>
              <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
                Anda dinyatakan siap untuk mengikuti ujian. Ujian terdiri dari 5 modul yang dipantau dengan timer. Pastikan koneksi internet stabil sebelum mulai.
              </p>
              <div className="pt-4">
                <Link
                  href="/exam"
                  className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 text-base"
                >
                  Mulai Ujian Seleksi Sekarang
                </Link>
              </div>
            </div>
          )}

          {/* TAB 5: PENGUMUMAN */}
          {activeTab === "pengumuman" && (
            <div className="max-w-3xl mx-auto space-y-6 fade-in py-5">
              {currentStage === "diterima" ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10 space-y-6 relative">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <span className="text-6xl">🎉</span>
                  <div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
                      Lulus Seleksi
                    </span>
                    <h2 className="font-display text-3xl font-extrabold text-slate-800 mt-4">
                      Selamat! Anda Dinyatakan Lulus
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                      Selamat bergabung sebagai mahasiswa baru di {INSTITUTION_NAME}. Kredensial akun sistem akademik Anda (SIAKAD) sedang disinkronisasikan.
                    </p>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/80 max-w-md mx-auto space-y-3 text-left text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nama Lengkap</span>
                      <span className="font-bold text-slate-800">{candidateName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">No. Pendaftaran</span>
                      <span className="font-mono font-bold text-slate-800">{candidateRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Program Studi</span>
                      <span className="font-bold text-[#0f487b]">{prodiName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jalur Pendaftaran</span>
                      <span className="font-bold text-slate-800">{entryPathName}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => triggerToast("Mengunduh Surat Kelulusan (Simulasi)...")}
                      className="px-6 py-3 bg-[#0f487b] text-white font-bold rounded-xl hover:bg-[#00719f] transition-all text-sm inline-flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>📥</span> Unduh Surat Kelulusan (LoA)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10 space-y-6 relative">
                  <div className="absolute top-0 inset-x-0 h-2 bg-rose-505"></div>
                  <span className="text-6xl">✉️</span>
                  <div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      Hasil Seleksi
                    </span>
                    <h2 className="font-display text-2xl font-bold text-slate-800 mt-4">
                      Terima Kasih atas Partisipasi Anda
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                      Kami menghargai ketertarikan Anda untuk mendaftar di {INSTITUTION_NAME}. Namun, setelah mengevaluasi berkas dan ujian seleksi, mohon maaf saat ini pendaftaran Anda belum dapat kami setujui.
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Jangan berkecil hati. Anda dapat mencoba mendaftar kembali pada gelombang berikutnya atau menghubungi layanan helpdesk kami untuk konsultasi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[210] bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 fade-up">
          <span className="text-emerald-500 font-bold">✓</span>
          <span className="text-sm font-medium text-slate-800">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
