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
  const activeCount = waves.filter((w) => w.status === "aktif").length;
  const totalCount = waves.length;

  return (
    <div className="space-y-6 fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Manajemen Gelombang PMB & Kuota Kursi
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
              Multi-Active Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Anda dapat **mengaktifkan lebih dari 1 gelombang secara bersamaan**. Gunakan sakelar **ON/OFF** pada masing-masing gelombang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Gelombang Aktif:</span>
            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
              {activeCount} / {totalCount} ON
            </span>
          </div>

          <button
            onClick={() => {
              setEditingWaveId(null);
              setWaveForm({
                name: "",
                code: "",
                academicPeriodLabel: "2026/2027 Ganjil",
                defaultPassword: "Pmb2026!",
                startDate: "",
                endDate: "",
                status: "belum_dibuka",
                openedProdis: [],
              });
              setShowWaveModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Tambah Gelombang Baru
          </button>
        </div>
      </div>

      {/* Gelombang Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {waves.map((w) => {
          const isActive = w.status === "aktif";
          return (
            <div
              key={w.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isActive
                  ? "bg-white border-emerald-300 shadow-md ring-2 ring-emerald-500/10"
                  : "bg-slate-50/80 border-slate-200 opacity-90"
              }`}
            >
              {/* Header Card with ON/OFF Switch */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
                      {w.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {isActive ? "GELOMBANG BUKA (ON)" : "DITUTUP (OFF)"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{w.name}</h3>
                </div>

                {/* Sakelar ON / OFF Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleWaveStatus(w.id, isActive ? "tertutup" : "aktif")}
                  title={isActive ? "Matikan (OFF) Gelombang" : "Aktifkan (ON) Gelombang"}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-extrabold ${
                      isActive ? "translate-x-7 text-emerald-600" : "translate-x-0 text-slate-500"
                    }`}
                  >
                    {isActive ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              {/* Info Detail */}
              <div className="text-slate-600 space-y-1.5 font-medium text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📅</span>
                  <span>
                    Tanggal: <strong className="text-slate-800">{w.startDate}</strong> s/d{" "}
                    <strong className="text-slate-800">{w.endDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">🎓</span>
                  <span>
                    Periode Akademik: <strong className="text-blue-700">{w.academicPeriodLabel || "-"}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-[11px]">
                  <span className="text-slate-400 font-medium">Status Pengisian: </span>
                  <span className={`font-bold ${isActive ? "text-emerald-700" : "text-slate-500"}`}>
                    {isActive ? "Siap Menerima Pendaftaran" : "Pendaftaran Dibatasi"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingWaveId(w.id);
                      setWaveForm({
                        name: w.name,
                        code: w.code,
                        academicPeriodLabel: w.academicPeriodLabel || "",
                        entryPathId: w.entryPathId || "",
                        defaultPassword: w.defaultPassword || "",
                        startDate: w.startDate,
                        endDate: w.endDate,
                        status: w.status,
                        openedProdis: w.openedProdis || [],
                      });
                      setShowWaveModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-all cursor-pointer"
                  >
                    ✏️ Edit Gelombang
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quota Settings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Setting Kuota Penerimaan Mahasiswa Per Prodi</h3>
            <p className="text-slate-500 text-[11px]">
              Tentukan batasan jumlah kuota calon mahasiswa baru yang dapat diterima per program studi.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Gelombang & Program Studi</th>
                <th className="px-4 py-3 text-center">Target Kuota Kursi</th>
                <th className="px-4 py-3 text-center">Terisi</th>
                <th className="px-4 py-3 text-right">Aksi Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotas.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{q.prodiName || q.studyProgramName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{q.waveName || "Gelombang"}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    {editingQuotaId === q.id ? (
                      <input
                        type="number"
                        value={editingQuotaValue}
                        onChange={(e) => setEditingQuotaValue(parseInt(e.target.value, 10) || 0)}
                        className="w-20 p-1 border border-blue-400 rounded font-mono text-center text-blue-700 font-bold"
                      />
                    ) : (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                        {q.quotaTotal || q.targetQuota || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                    {q.quotaFilled || q.filledCount || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingQuotaId === q.id ? (
                      <button
                        onClick={() => handleSaveQuota(q.id)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        Simpan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingQuotaId(q.id);
                          setEditingQuotaValue(q.quotaTotal || q.targetQuota || 0);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
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
