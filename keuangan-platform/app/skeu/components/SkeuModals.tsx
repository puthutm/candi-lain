"use client";

interface PmbFeeRate {
  id: string;
  waveLabel: string;
  registrationFee: string;
  examFee: string;
  reregistrationFee: string;
  matriculationFee: string;
}

interface SkeuModalsProps {
  showClearanceModal: boolean;
  setShowClearanceModal: (show: boolean) => void;
  clearanceNIM: string;
  setClearanceNIM: (nim: string) => void;
  clearanceResult: any;
  handleCheckClearance: () => void;
  showPmbFeeModal: boolean;
  setShowPmbFeeModal: (show: boolean) => void;
  editingPmbFee: PmbFeeRate | null;
  pmbFeeForm: {
    waveLabel: string;
    registrationFee: string;
    examFee: string;
    reregistrationFee: string;
    matriculationFee: string;
  };
  setPmbFeeForm: (form: any) => void;
  savingPmbFee: boolean;
  handleSavePmbFee: (e: React.FormEvent) => void;
}

export default function SkeuModals({
  showClearanceModal,
  setShowClearanceModal,
  clearanceNIM,
  setClearanceNIM,
  clearanceResult,
  handleCheckClearance,
  showPmbFeeModal,
  setShowPmbFeeModal,
  editingPmbFee,
  pmbFeeForm,
  setPmbFeeForm,
  savingPmbFee,
  handleSavePmbFee,
}: SkeuModalsProps) {
  return (
    <>
      {/* Quick Clearance Check Modal */}
      {showClearanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">🔍 Quick Financial Clearance Check</h3>
              <button
                onClick={() => setShowClearanceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Masukkan NIM Mahasiswa</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Misal: 26090182"
                    value={clearanceNIM}
                    onChange={(e) => setClearanceNIM(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-[#0f487b]"
                  />
                  <button
                    onClick={handleCheckClearance}
                    className="px-4 py-2.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Cek Clearance
                  </button>
                </div>
              </div>

              {clearanceResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    clearanceResult.cleared
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Status Clearance Financial:</span>
                    <span className="text-sm">
                      {clearanceResult.cleared ? "✓ CLEARED (LUNAS)" : "❌ BLOCKED (ADA TUNGGAKAN)"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium">
                    {clearanceResult.cleared
                      ? "Mahasiswa diizinkan untuk verifikasi pengajuan KRS & cetak kartu ujian KHS."
                      : `Terdapat tunggakan sebesar Rp ${Number(clearanceResult.outstanding || 0).toLocaleString("id-ID")}. Mahasiswa terkunci dari pengisian KRS.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PMB Fee Rates Modal */}
      {showPmbFeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingPmbFee ? "Edit Tarif PMB" : "Tambah Tarif Gelombang PMB"}
              </h3>
              <button
                onClick={() => setShowPmbFeeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePmbFee} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Label Gelombang</label>
                <input
                  type="text"
                  required
                  placeholder="Gelombang 1 Reguler 2026"
                  value={pmbFeeForm.waveLabel}
                  onChange={(e) => setPmbFeeForm({ ...pmbFeeForm, waveLabel: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Biaya Formulir (Rp)</label>
                  <input
                    type="number"
                    value={pmbFeeForm.registrationFee}
                    onChange={(e) => setPmbFeeForm({ ...pmbFeeForm, registrationFee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1">Biaya Ujian CBT (Rp)</label>
                  <input
                    type="number"
                    value={pmbFeeForm.examFee}
                    onChange={(e) => setPmbFeeForm({ ...pmbFeeForm, examFee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Daftar Ulang (Rp)</label>
                  <input
                    type="number"
                    value={pmbFeeForm.reregistrationFee}
                    onChange={(e) => setPmbFeeForm({ ...pmbFeeForm, reregistrationFee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1">Matrikulasi (Rp)</label>
                  <input
                    type="number"
                    value={pmbFeeForm.matriculationFee}
                    onChange={(e) => setPmbFeeForm({ ...pmbFeeForm, matriculationFee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPmbFeeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPmbFee}
                  className="px-5 py-2 bg-[#0f487b] text-white rounded-xl font-bold hover:bg-blue-700 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingPmbFee ? "Menyimpan..." : "Simpan Tarif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
