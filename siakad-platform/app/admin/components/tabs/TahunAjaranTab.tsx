"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";
import { AdminTab } from "../AdminSidebar";

interface AcademicPeriod {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface TahunAjaranTabProps {
  setActiveModal: (modal: ModalType) => void;
  setActiveTab: (tab: AdminTab) => void;
  triggerToast: (msg: string) => void;
}

export default function TahunAjaranTab({
  setActiveModal,
  setActiveTab,
  triggerToast: _triggerToast,
}: TahunAjaranTabProps) {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic?type=periode");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPeriods(data.data);
      }
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">📅</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FED524]">
                Master · Tahun Ajaran
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Tahun Ajaran UNSIA</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Master tahun ajaran terhubung dengan database Periode Akademik SIAKAD.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_ta")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Tahun Ajaran
          </button>
        </div>
      </div>

      {/* Info Callout Box (Req #12) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <span className="text-blue-600 text-base font-bold shrink-0">ℹ️</span>
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>Catatan Sesuai Aturan Kemenristekdikti:</strong> Tahun Ajaran hanya menyimpan format tahun saja (misal <strong>2026/2027</strong>). Pemecahan menjadi semester Ganjil & Genap dilakukan di menu <strong>Periode Akademik</strong> yang berisi tanggal kuliah, UTS, UAS, libur nasional, dan kalender aktivitas akademik per semester.
        </p>
      </div>

      {/* Card Grid Roster */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Memuat data tahun ajaran...
        </div>
      ) : periods.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Belum ada tahun ajaran terdaftar di database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {periods.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{p.name}</span>
                <span className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full ${p.status === "berjalan" ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500" : "bg-slate-100 text-slate-600"}`}>
                  {p.status || "Terjadwal"}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 font-medium border-t border-slate-100 pt-3">
                <p>• Tanggal: {p.startDate || "-"} s/d {p.endDate || "-"}</p>
              </div>
              <button
                onClick={() => setActiveTab("periode")}
                className="w-full mt-2 py-2 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Kelola Periode →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
