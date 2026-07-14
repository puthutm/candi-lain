"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: string;
  rankGroup: string;
  status: string;
  bankAccountNumber: string;
  bankName: string;
}

interface Attendance {
  id: string;
  attendanceDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  requestedAt: string;
  typeName: string;
  typeCode: string;
}

export default function HrisPortalDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Leave Form State
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveTypeCode, setLeaveTypeCode] = useState("tahunan");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => {
      setNotice(null);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/portal/activity");
      const data = await res.json();
      if (data.success) {
        setEmployee(data.employee);
        setAttendances(data.attendances || []);
        setLeaveRequests(data.leaveRequests || []);
      } else {
        triggerNotice(data.error || "Gagal memuat data portal", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan koneksi: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check session first
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!data.success || !data.authenticated) {
          router.push("/login");
        } else {
          fetchData();
        }
      } catch {
        router.push("/login");
      }
    }
    checkSession();
  }, [router]);

  const handleAttendance = async () => {
    setSubmittingAttendance(true);
    triggerNotice("Memproses presensi...");
    try {
      const res = await fetch("/api/portal/attendance", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message);
        fetchData();
      } else {
        triggerNotice(data.error || "Gagal memproses presensi", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      triggerNotice("Mohon lengkapi semua data pengajuan cuti", true);
      return;
    }
    setSubmittingLeave(true);
    triggerNotice("Mengirim pengajuan cuti...");
    try {
      const res = await fetch("/api/portal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeCode,
          startDate,
          endDate,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message);
        setShowLeaveForm(false);
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchData();
      } else {
        triggerNotice(data.error || "Gagal mengajukan cuti", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  // Check if already checked in / checked out today
  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayAttendance = attendances.find(a => a.attendanceDate === todayStr);
  const attendanceButtonText = !todayAttendance
    ? "⏰ Presensi Masuk"
    : !todayAttendance.checkOut
    ? "⏰ Presensi Keluar"
    : "✓ Sudah Presensi";

  const isAttendanceDisabled = submittingAttendance || (todayAttendance && todayAttendance.checkOut);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#FED524] border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Portal HRIS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Toast Notice */}
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FED524] to-[#c29c0f] flex items-center justify-center shadow-lg">
            <span className="text-xl">💼</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Portal Kepegawaian (HRIS Self-Service)</h1>
            <p className="text-xs text-slate-400 font-medium">Informasi Profil, Presensi, & Pengajuan Cuti Mandiri</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* CARD PROFIL PEGAWAI */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-[#FED524] flex items-center justify-center text-4xl shadow-inner">
            👤
          </div>
          <div className="flex-1 text-center sm:text-left flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-bold text-slate-200">{employee?.fullName || "Nama Pegawai"}</h2>
              <span className="text-[10px] bg-[#004996]/20 text-[#3b82f6] px-2.5 py-0.5 rounded-full font-bold uppercase w-fit mx-auto sm:mx-0">
                {employee?.employeeType || "Dosen"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">NIP: {employee?.employeeNumber || "-"}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Status Keaktifan: <span className="text-emerald-400 font-bold uppercase">{employee?.status || "aktif"}</span></p>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button 
              onClick={handleAttendance}
              disabled={!!isAttendanceDisabled}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl transition shadow-lg w-full sm:w-auto text-center ${
                todayAttendance && todayAttendance.checkOut
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none"
                  : "bg-[#004996] hover:bg-[#004996]/90 text-white shadow-[#004996]/15"
              }`}
            >
              {attendanceButtonText}
            </button>
            <button 
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition w-full sm:w-auto text-center"
            >
              {showLeaveForm ? "✕ Batal Cuti" : "🌴 Ajukan Cuti"}
            </button>
          </div>
        </div>

        {/* FORM PENGAJUAN CUTI */}
        {showLeaveForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Formulir Pengajuan Cuti</h3>
              <p className="text-xs text-slate-400">Silakan isi detail pengajuan cuti Anda</p>
            </div>
            
            <form onSubmit={handleLeaveSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Jenis Cuti</label>
                  <select 
                    value={leaveTypeCode} 
                    onChange={(e) => setLeaveTypeCode(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="tahunan">Cuti Tahunan</option>
                    <option value="sakit">Cuti Sakit</option>
                    <option value="cuti_besar">Cuti Besar</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700 [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Alasan</label>
                <textarea 
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tulis alasan pengajuan cuti secara ringkas..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-slate-700 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={submittingLeave}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-900/25"
                >
                  {submittingLeave ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LOG RIWAYAT & AKTIVITAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LOG PRESENSI */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Riwayat Presensi</h3>
              <p className="text-[10px] text-slate-400">Log kehadiran 10 hari terakhir</p>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-80 divide-y divide-slate-800/50">
              {attendances.map((att) => (
                <div key={att.id} className="pt-3 pb-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-300 block">{att.attendanceDate}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {att.checkIn || "--:--:--"} s/d {att.checkOut || "--:--:--"} ({att.workHours} jam)
                    </span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    att.status === "hadir" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : att.status === "terlambat" 
                      ? "bg-amber-500/10 text-amber-400" 
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {att.status}
                  </span>
                </div>
              ))}
              {attendances.length === 0 && (
                <p className="py-6 text-center text-slate-500 text-xs font-semibold">Belum ada riwayat kehadiran.</p>
              )}
            </div>
          </div>

          {/* LOG PENGAJUAN CUTI */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Riwayat Cuti</h3>
              <p className="text-[10px] text-slate-400">Log pengajuan cuti Anda</p>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-80 divide-y divide-slate-800/50">
              {leaveRequests.map((lv) => (
                <div key={lv.id} className="pt-3 pb-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">{lv.typeName}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 text-slate-400 rounded uppercase font-mono">{lv.typeCode}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {lv.startDate} s/d {lv.endDate}
                    </span>
                    <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">"{lv.reason}"</p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    lv.status === "disetujui" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : lv.status === "ditolak" 
                      ? "bg-rose-500/10 text-rose-400" 
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {lv.status}
                  </span>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="py-6 text-center text-slate-500 text-xs font-semibold">Belum ada riwayat pengajuan cuti.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
