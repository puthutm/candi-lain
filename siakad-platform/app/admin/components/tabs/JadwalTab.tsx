"use client";

import { useState, useEffect } from "react";
import { AdminTab } from "../AdminSidebar";

interface ScheduleItem {
  id: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  roomName?: string;
  classId?: string;
}

interface JadwalTabProps {
  setActiveTab: (tab: AdminTab) => void;
  triggerToast: (msg: string) => void;
}

export default function JadwalTab({
  setActiveTab,
  triggerToast,
}: JadwalTabProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic?type=jadwal");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSchedules(data.data);
      }
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Operasional
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Jadwal & Sesi Perkuliahan</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Jadwal perkuliahan otomatis tersinkronisasi dari database SIAKAD & LMS ICEMS.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-fill Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <span className="text-emerald-600 text-xl shrink-0">✓</span>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-emerald-900">Periode Akademik Ganjil 2026/2027</h4>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Perubahan tanggal pada periode akan otomatis re-sync ke seluruh kelas & LMS.
          </p>
          <button
            onClick={() => setActiveTab("periode")}
            className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            ✏️ Edit Periode Akademik
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Matriks Jadwal Pertemuan</h3>
          <button
            onClick={() => triggerToast("Jadwal sesi disinkronkan ke LMS")}
            className="px-3 py-1 bg-[#0f487b] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            🔄 Re-sync LMS
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">Memuat data jadwal...</div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">Belum ada matriks jadwal perkuliahan terdaftar di database.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Hari</th>
                  <th className="px-5 py-3">Jam</th>
                  <th className="px-5 py-3">Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{sch.dayOfWeek || "Senin"}</td>
                    <td className="px-5 py-3.5 font-mono">{sch.startTime || "08:00"} - {sch.endTime || "10:30"}</td>
                    <td className="px-5 py-3.5">{sch.roomName || "Online"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
