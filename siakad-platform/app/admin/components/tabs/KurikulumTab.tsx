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
  triggerToast: _triggerToast,
}: KurikulumTabProps) {
  const [curricula, setCurricula] = useState<KurikulumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState<KurikulumItem | null>(null);
  const [curriculumCourses, setCurriculumCourses] = useState<any[]>([]);

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

  const handleOpenDetail = async (k: KurikulumItem) => {
    setSelectedCurriculum(k);
    try {
      const res = await fetch("/api/academic?type=matakuliah");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCurriculumCourses(data.data);
      }
    } catch {
      setCurriculumCourses([]);
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
                onClick={() => handleOpenDetail(k)}
                className="w-full py-2 bg-slate-100 hover:bg-[#0f487b] hover:text-white text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer"
              >
                Lihat Detail Kurikulum →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Kurikulum */}
      {selectedCurriculum && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#0f487b] uppercase tracking-wider block mb-0.5">
                  Detail Struktur Kurikulum Resmi
                </span>
                <h3 className="font-black text-slate-800 text-xl font-display">
                  {selectedCurriculum.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Target Kelulusan: <strong>{selectedCurriculum.totalSks || 144} SKS</strong> · Status: <span className="text-emerald-600 font-bold">{selectedCurriculum.status || "Aktif"}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCurriculum(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List Mata Kuliah per Semester */}
            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-bold text-slate-700">
                  <span>📚 Mata Kuliah Terkait Database ({curriculumCourses.length} MK)</span>
                  <span className="text-indigo-600">Total {selectedCurriculum.totalSks || 144} SKS</span>
                </div>
                {curriculumCourses.length === 0 ? (
                  <div className="text-center text-slate-400 py-4 font-medium">Belum ada mata kuliah yang terhubung.</div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {curriculumCourses.map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between hover:bg-white px-2 rounded-lg transition">
                        <div>
                          <span className="font-mono font-bold text-indigo-700 mr-2">[{c.code}]</span>
                          <span className="font-bold text-slate-800">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-md text-[10px]">
                            {c.sks} SKS
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                            {c.type || "Wajib"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCurriculum(null)}
                className="px-6 py-2.5 bg-[#0f487b] hover:bg-[#00719f] text-white font-bold rounded-xl cursor-pointer text-xs shadow-md"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
