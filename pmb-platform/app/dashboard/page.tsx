"use client";

import { useState, useEffect } from "react";
import ApplicantSidebar, { TabType } from "./components/ApplicantSidebar";
import ApplicantHeader from "./components/ApplicantHeader";
import ApplicantModals from "./components/ApplicantModals";

// Tab Components
import DashboardTab from "./components/tabs/DashboardTab";
import TagihanTab from "./components/tabs/TagihanTab";
import BiodataTab from "./components/tabs/BiodataTab";
import UjianTab from "./components/tabs/UjianTab";
import PengumumanTab from "./components/tabs/PengumumanTab";

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "processing" | "paid">("unpaid");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRef, setCandidateRef] = useState("");
  const [currentStage, setCurrentStage] = useState("");

  // Dynamic applicant properties
  const [prodiName, setProdiName] = useState("");
  const [entryPathName, setEntryPathName] = useState("");
  const [formFee] = useState(350000);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Biodata form states
  const [nik, setNik] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("L");
  const [isProfileSubmitted, setIsProfileSubmitted] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    fetchApplicantOverview();
  }, []);

  const fetchApplicantOverview = async () => {
    try {
      const res = await fetch("/api/candidate/profile");
      const data = await res.json();
      if (data.success && data.candidate) {
        setCandidateName(data.candidate.fullName);
        setCandidateRef(data.candidate.registrationNumber);
        setProdiName(data.candidate.studyProgramName || "S1 Informatika");
        setEntryPathName(data.candidate.entryPathName || "Reguler Ganjil");
        setPaymentStatus(data.candidate.paymentStatus || "unpaid");
        setCurrentStage(data.candidate.stage || "Pembayaran Formulir");
        if (data.candidate.nik) setNik(data.candidate.nik);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulatePayment = async () => {
    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/candidate/pay-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setPaymentStatus("paid");
        triggerToast("Pembayaran Formulir Berhasil! Status berubah LUNAS.");
        fetchApplicantOverview();
      } else {
        triggerToast("Gagal bayar: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast("Password & konfirmasi tidak cocok.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/candidate/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Password berhasil diperbarui!");
        setShowPasswordModal(false);
      } else {
        triggerToast("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await fetch("/api/candidate/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nik, birthPlace, birthDate, gender }),
      });
      const data = await res.json();
      if (data.success) {
        setIsProfileSubmitted(true);
        triggerToast("Biodata berhasil disimpan!");
      } else {
        triggerToast("Gagal: " + data.error);
      }
    } catch (err: any) {
      triggerToast(err.message);
    } finally {
      setSubmittingProfile(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 font-sans">
      {/* Sidebar Component */}
      <ApplicantSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        candidateName={candidateName}
        candidateRef={candidateRef}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative w-full h-full">
        {/* Header Component */}
        <ApplicantHeader
          setIsSidebarOpen={setIsSidebarOpen}
          candidateName={candidateName}
        />

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24">
          {activeTab === "dashboard" && (
            <DashboardTab
              candidateName={candidateName}
              prodiName={prodiName}
              entryPathName={entryPathName}
              paymentStatus={paymentStatus}
              currentStage={currentStage}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "tagihan" && (
            <TagihanTab
              formFee={formFee}
              paymentStatus={paymentStatus}
              submittingPayment={submittingPayment}
              handleSimulatePayment={handleSimulatePayment}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "data" && (
            <BiodataTab
              nik={nik}
              setNik={setNik}
              birthPlace={birthPlace}
              setBirthPlace={setBirthPlace}
              birthDate={birthDate}
              setBirthDate={setBirthDate}
              gender={gender}
              setGender={setGender}
              isProfileSubmitted={isProfileSubmitted}
              submittingProfile={submittingProfile}
              handleProfileSubmit={handleProfileSubmit}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "ujian" && (
            <UjianTab
              paymentStatus={paymentStatus}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === "pengumuman" && (
            <PengumumanTab
              paymentStatus={paymentStatus}
              candidateName={candidateName}
              prodiName={prodiName}
              triggerToast={triggerToast}
            />
          )}
        </div>
      </main>

      {/* Modal Dialog Suite */}
      <ApplicantModals
        showPasswordModal={showPasswordModal}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        changingPassword={changingPassword}
        handleChangePasswordSubmit={handleChangePasswordSubmit}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f487b] text-white border border-blue-400 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 fade-up">
          <span className="text-[#FED524]">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
