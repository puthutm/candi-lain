"use client";

interface PmbModalsProps {
  showWaveModal: boolean;
  setShowWaveModal: (show: boolean) => void;
  waveForm: {
    name: string;
    code: string;
    academicPeriodLabel: string;
    entryPathId?: string;
    defaultPassword: string;
    startDate: string;
    endDate: string;
    status: string;
    openedProdis?: { studyProgramId: string; prodiName: string; prodiCode: string; quotaTotal: number }[];
  };
  setWaveForm: (form: any) => void;
  editingWaveId: string | null;
  isCreatingWave: boolean;
  handleSaveWave: (e: React.FormEvent) => void;
  academicPeriods?: { id: string; name: string; status: string }[];
  entryPaths?: { id: string; name: string; code: string }[];
  studyPrograms?: { id: string; name: string; code: string; faculty: string }[];
}

export default function PmbModals({
  showWaveModal,
  setShowWaveModal,
  waveForm,
  setWaveForm,
  editingWaveId,
  isCreatingWave,
  handleSaveWave,
  academicPeriods = [],
  entryPaths = [],
  studyPrograms = [],
}: PmbModalsProps) {
  if (!showWaveModal) return null;

  const openedProdiList = waveForm.openedProdis || [];

  const isProdiChecked = (prodiId: string) => {
    return openedProdiList.some((p) => p.studyProgramId === prodiId);
  };

  const getProdiQuota = (prodiId: string) => {
    const item = openedProdiList.find((p) => p.studyProgramId === prodiId);
    return item ? item.quotaTotal : 50;
  };

  const toggleProdi = (sp: { id: string; name: string; code?: string }) => {
    if (isProdiChecked(sp.id)) {
      const updated = openedProdiList.filter((p) => p.studyProgramId !== sp.id);
      setWaveForm({ ...waveForm, openedProdis: updated });
    } else {
      const updated = [
        ...openedProdiList,
        {
          studyProgramId: sp.id,
          prodiName: sp.name,
          prodiCode: sp.code || sp.name.substring(0, 4).toUpperCase(),
          quotaTotal: 50,
        },
      ];
      setWaveForm({ ...waveForm, openedProdis: updated });
    }
  };

  const updateProdiQuota = (prodiId: string, quota: number) => {
    const updated = openedProdiList.map((p) =>
      p.studyProgramId === prodiId ? { ...p, quotaTotal: quota } : p
    );
    setWaveForm({ ...waveForm, openedProdis: updated });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {editingWaveId ? "Edit Gelombang PMB" : "Tambah Gelombang Baru"}
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Pilih periode akademik dari SIAKAD, jenis jalur masuk, dan prodi yang dibuka.
            </p>
          </div>
          <button
            onClick={() => setShowWaveModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveWave} className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Nama Gelombang</label>
            <input
              type="text"
              required
              placeholder="Gelombang 1 Reguler 2026/2027"
              value={waveForm.name}
              onChange={(e) => setWaveForm({ ...waveForm, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Kode Gelombang</label>
              <input
                type="text"
                required
                placeholder="GEL1-2026"
                value={waveForm.code}
                onChange={(e) => setWaveForm({ ...waveForm, code: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block mb-1">Periode Akademik (dari SIAKAD)</label>
              <select
                value={waveForm.academicPeriodLabel}
                onChange={(e) => setWaveForm({ ...waveForm, academicPeriodLabel: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
              >
                {academicPeriods.length > 0 ? (
                  academicPeriods.map((period) => (
                    <option key={period.id} value={period.name}>
                      {period.name} ({period.status})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2026/2027 Ganjil">2026/2027 Ganjil</option>
                    <option value="2026/2027 Genap">2026/2027 Genap</option>
                    <option value="2027/2028 Ganjil">2027/2028 Ganjil</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Jenis / Jalur Masuk PMB</label>
            <select
              value={waveForm.entryPathId || ""}
              onChange={(e) => setWaveForm({ ...waveForm, entryPathId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
            >
              <option value="">-- Pilih Jenis Jalur Masuk --</option>
              {entryPaths.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name} ({ep.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Tanggal Buka</label>
              <input
                type="date"
                required
                value={waveForm.startDate}
                onChange={(e) => setWaveForm({ ...waveForm, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block mb-1">Tanggal Tutup</label>
              <input
                type="date"
                required
                value={waveForm.endDate}
                onChange={(e) => setWaveForm({ ...waveForm, endDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Program Studi yang Dibuka & Kuota */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              Pilih Program Studi yang Dibuka & Kuota (Data Referensi / SIAKAD)
            </label>
            <p className="text-[11px] text-slate-500 font-normal">
              Centang program studi dari SIAKAD yang mau dibuka di gelombang ini dan tentukan kuotanya.
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              {studyPrograms.map((sp) => {
                const checked = isProdiChecked(sp.id);
                return (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200"
                  >
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProdi(sp)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>
                        {sp.name} <span className="text-slate-400 font-mono text-[10px]">({sp.faculty || "S1"})</span>
                      </span>
                    </label>

                    {checked && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-medium">Kuota:</span>
                        <input
                          type="number"
                          min="1"
                          value={getProdiQuota(sp.id)}
                          onChange={(e) => updateProdiQuota(sp.id, parseInt(e.target.value, 10) || 0)}
                          className="w-16 p-1 border border-slate-300 rounded font-mono text-center text-xs font-bold text-blue-700"
                        />
                        <span className="text-[10px] text-slate-500">kursi</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowWaveModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreatingWave}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isCreatingWave ? "Menyimpan..." : "Simpan Gelombang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
