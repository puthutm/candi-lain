"use client";

interface GelombangPanelProps {
  waves: any[];
  quotas: any[];
  editingQuotaId: string | null;
  setEditingQuotaId: (id: string | null) => void;
  editingQuotaValue: number;
  setEditingQuotaValue: (val: number) => void;
  setShowWaveModal: (show: boolean) => void;
  setEditingWaveId: (id: string | null) => void;
  setWaveForm: (form: any) => void;
  handleToggleWaveStatus: (id: string, status: string) => void;
  handleSaveQuota: (quotaId: string) => void;
}

export default function GelombangPanel({
  waves,
  quotas,
  editingQuotaId,
  setEditingQuotaId,
  editingQuotaValue,
  setEditingQuotaValue,
  setShowWaveModal,
  setEditingWaveId,
  setWaveForm,
  handleToggleWaveStatus,
  handleSaveQuota,
}: GelombangPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Manajemen Gelombang PMB & Kuota Penerimaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola jadwal pembukaan gelombang & batas kuota kursi per program studi.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingWaveId(null);
            setWaveForm({ name: "", code: "", academicPeriodLabel: "2026/2027 Ganjil", defaultPassword: "Pmb2026!", startDate: "", endDate: "", status: "belum_dibuka" });
            setShowWaveModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          + Tambah Gelombang Baru
        </button>
      </div>

      {/* Gelombang Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {waves.map((w) => (
          <div key={w.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] text-blue-700 font-bold">{w.code}</span>
                <h3 className="text-base font-bold text-slate-800">{w.name}</h3>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${w.status === "aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                ● {w.status}
              </span>
            </div>
            <div className="text-slate-600 space-y-1 font-medium">
              <p>🗓️ Tanggal: {w.startDate} s/d {w.endDate}</p>
              <p>🎓 Periode Akademik: {w.academicPeriodLabel}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleToggleWaveStatus(w.id, w.status === "aktif" ? "tertutup" : "aktif")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                {w.status === "aktif" ? "Tutup Gelombang" : "Buka Gelombang"}
              </button>
              <button
                onClick={() => {
                  setEditingWaveId(w.id);
                  setWaveForm({ name: w.name, code: w.code, academicPeriodLabel: w.academicPeriodLabel || "", defaultPassword: w.defaultPassword || "", startDate: w.startDate, endDate: w.endDate, status: w.status });
                  setShowWaveModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quota Settings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Setting Kuota Penerimaan Mahasiswa Per Prodi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">Program Studi</th>
                <th className="px-4 py-3 text-center">Target Kuota Kursi</th>
                <th className="px-4 py-3 text-center">Terisi</th>
                <th className="px-4 py-3 text-right">Aksi Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotas.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{q.studyProgramName}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    {editingQuotaId === q.id ? (
                      <input
                        type="number"
                        value={editingQuotaValue}
                        onChange={(e) => setEditingQuotaValue(parseInt(e.target.value, 10) || 0)}
                        className="w-20 p-1 border border-slate-300 rounded font-mono text-center"
                      />
                    ) : (
                      q.targetQuota
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                    {q.filledCount || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingQuotaId === q.id ? (
                      <button
                        onClick={() => handleSaveQuota(q.id)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Simpan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingQuotaId(q.id);
                          setEditingQuotaValue(q.targetQuota);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Edit Kuota
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
