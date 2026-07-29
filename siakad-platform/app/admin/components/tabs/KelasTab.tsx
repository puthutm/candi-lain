"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";

interface KelasItem {
  id: string;
  name: string;
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  courseId?: string;
  lecturerUserId?: string;
  scheduleText?: string;
  roomName?: string;
}

interface KelasTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function KelasTab({
  setActiveModal,
  triggerToast,
}: KelasTabProps) {
  const [classList, setClassList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic?type=kelas");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClassList(data.data);
      }
    } catch {
      setClassList([]);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = classList.filter((c) => c.status === "aktif" || !c.status).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-[#FED524] font-bold shadow-lg">
        <h2 className="font-display font-black text-2xl text-white">Kelas Kuliah · Periode 2026/2027 Ganjil</h2>
        <p className="text-blue-100 text-sm mt-1.5 leading-relaxed font-normal">
          {classList.length} kelas terdaftar di database. Kelola kelas paralel, dosen pengampu, dan kuota mahasiswa.
        </p>
      </div>

      {/* 4 KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Kelas</span>
          <p className="font-display font-black text-2xl text-slate-800">{classList.length}</p>
          <p className="text-[10px] text-slate-500 font-bold">Database Realtime</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Kelas Aktif</span>
          <p className="font-display font-black text-2xl text-emerald-700">{activeCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold">Berjalan</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-violet-700 uppercase font-bold tracking-wider">Kelas Paralel</span>
          <p className="font-display font-black text-2xl text-violet-700">{classList.length > 0 ? Math.floor(classList.length / 2) : 0}</p>
          <p className="text-[10px] text-violet-600 font-bold">Kelas paralel</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Kelas Online</span>
          <p className="font-display font-black text-2xl text-amber-700">{classList.length}</p>
          <p className="text-[10px] text-amber-600 font-bold">Zoom + LMS ICEMS</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Kelas Perkuliahan Berjalan</h3>
          <button
            onClick={() => setActiveModal("tambah_kelas")}
            className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-[#00719f] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
          >
            + Buka Kelas Paralel
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">Memuat data kelas...</div>
          ) : classList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">Belum ada kelas perkuliahan di database.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Kelas</th>
                  <th className="px-4 py-3 text-center">Kuota</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classList.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{cls.name}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{cls.enrolledCount || 0} / {cls.capacity || 35}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        ● {cls.status || "Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => triggerToast(`Membuka detail kelas ${cls.name}`)}
                        className="text-[#0f487b] hover:underline font-bold cursor-pointer"
                      >
                        Detail & Peserta →
                      </button>
                    </td>
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
