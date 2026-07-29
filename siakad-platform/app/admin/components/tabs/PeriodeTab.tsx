"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";

interface AcademicPeriod {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface PeriodeTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function PeriodeTab({
  setActiveModal,
  triggerToast,
}: PeriodeTabProps) {
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
                Master · Periode Akademik
              </span>
            </div>
            <h2 className="font-display font-black text-2xl">Periode Akademik (Semester)</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Daftar periode akademik semester aktif & mendatang terhubung dengan database SIAKAD.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_periode")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Periode
          </button>
        </div>
      </div>

      {/* List Card */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Memuat data periode...
        </div>
      ) : periods.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Belum ada periode akademik di database.
        </div>
      ) : (
        <div className="space-y-4">
          {periods.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-800 font-display">{p.name}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.status === "berjalan" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                  ● Status: {p.status || "terjadwal"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tanggal: {p.startDate || "-"} s/d {p.endDate || "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
