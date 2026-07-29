"use client";

import { useState, useEffect } from "react";
import { ModalType } from "../AdminModals";

interface KurikulumItem {
  id: string;
  name: string;
  year?: number;
  totalSks?: number;
  status?: string;
  studyProgramId?: string;
}

interface KurikulumTabProps {
  setActiveModal: (modal: ModalType) => void;
  triggerToast: (msg: string) => void;
}

export default function KurikulumTab({
  setActiveModal,
  triggerToast,
}: KurikulumTabProps) {
  const [curricula, setCurricula] = useState<KurikulumItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic?type=kurikulum");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCurricula(data.data);
      }
    } catch {
      setCurricula([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      {/* Gradient Banner */}
      <div className="bg-gradient-to-br from-[#0a345c] via-[#0f487b] to-[#00719f] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-black text-2xl">Kurikulum Program Studi</h2>
            <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
              Master kurikulum resmi per program studi terintegrasi dengan database SIAKAD.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("tambah_kurikulum")}
            className="px-4 py-2.5 bg-[#FED524] text-[#031f3a] hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
          >
            + Tambah Kurikulum
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Memuat data kurikulum...
        </div>
      ) : curricula.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
          Belum ada kurikulum terdaftar di database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {curricula.map((k) => (
            <div key={k.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider">
                    KUR-{k.year || 2026}
                  </span>
                  <h3 className="text-base font-bold text-slate-800">{k.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                  {k.status || "Aktif"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 font-mono text-center">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">TOTAL SKS</span>
                  <span className="font-bold text-slate-800 text-sm">{k.totalSks || 144}</span>
                </div>
              </div>
              <button
                onClick={() => triggerToast(`Membuka detail kurikulum ${k.name}`)}
                className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer"
              >
                Lihat Detail Kurikulum →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
