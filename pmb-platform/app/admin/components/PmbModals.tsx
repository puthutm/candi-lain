"use client";

interface PmbModalsProps {
  showWaveModal: boolean;
  setShowWaveModal: (show: boolean) => void;
  waveForm: {
    name: string;
    code: string;
    academicPeriodLabel: string;
    defaultPassword: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  setWaveForm: (form: any) => void;
  editingWaveId: string | null;
  isCreatingWave: boolean;
  handleSaveWave: (e: React.FormEvent) => void;
}

export default function PmbModals({
  showWaveModal,
  setShowWaveModal,
  waveForm,
  setWaveForm,
  editingWaveId,
  isCreatingWave,
  handleSaveWave,
}: PmbModalsProps) {
  if (!showWaveModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm">
            {editingWaveId ? "Edit Gelombang PMB" : "Tambah Gelombang Baru"}
          </h3>
          <button
            onClick={() => setShowWaveModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveWave} className="space-y-3 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Nama Gelombang</label>
            <input
              type="text"
              required
              placeholder="Gelombang 1 Reguler 2026"
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
              <label className="block mb-1">Periode Akademik</label>
              <input
                type="text"
                required
                placeholder="2026/2027 Ganjil"
                value={waveForm.academicPeriodLabel}
                onChange={(e) => setWaveForm({ ...waveForm, academicPeriodLabel: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>
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
