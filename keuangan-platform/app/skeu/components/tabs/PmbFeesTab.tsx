"use client";

export interface PmbFeeRate {
  id: string;
  waveLabel: string;
  registrationFee: string;
  examFee: string;
  reregistrationFee: string;
  matriculationFee: string;
}

interface PmbFeesTabProps {
  pmbFeeRates: PmbFeeRate[];
  setShowPmbFeeModal: (show: boolean) => void;
  setEditingPmbFee: (rate: PmbFeeRate | null) => void;
  setPmbFeeForm: (form: any) => void;
  triggerNotice: (msg: string) => void;
}

export default function PmbFeesTab({
  pmbFeeRates,
  setShowPmbFeeModal,
  setEditingPmbFee,
  setPmbFeeForm,
  triggerNotice,
}: PmbFeesTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Setting Tarif Formulir & Biaya PMB
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tarif formulir pendaftaran, ujian CBT, daftar ulang, & matrikulasi per gelombang.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerNotice("Memperbarui data tarif PMB...")}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              setEditingPmbFee(null);
              setPmbFeeForm({ waveLabel: "", registrationFee: "350000", examFee: "0", reregistrationFee: "1500000", matriculationFee: "500000" });
              setShowPmbFeeModal(true);
            }}
            className="px-4 py-2 bg-[#0f487b] text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            + Tambah Tarif Gelombang PMB
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">Gelombang PMB</th>
              <th className="px-4 py-3 text-right">Biaya Formulir</th>
              <th className="px-4 py-3 text-right">Biaya Ujian</th>
              <th className="px-4 py-3 text-right">Daftar Ulang</th>
              <th className="px-4 py-3 text-right">Matrikulasi</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {pmbFeeRates.map((rate) => (
              <tr key={rate.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-sans font-bold text-slate-800">{rate.waveLabel}</td>
                <td className="px-4 py-3 text-right font-bold text-[#0f487b]">
                  Rp {Number(rate.registrationFee || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  Rp {Number(rate.examFee || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right text-emerald-700 font-bold">
                  Rp {Number(rate.reregistrationFee || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  Rp {Number(rate.matriculationFee || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right font-sans">
                  <button
                    onClick={() => {
                      setEditingPmbFee(rate);
                      setPmbFeeForm({
                        waveLabel: rate.waveLabel,
                        registrationFee: rate.registrationFee,
                        examFee: rate.examFee,
                        reregistrationFee: rate.reregistrationFee,
                        matriculationFee: rate.matriculationFee,
                      });
                      setShowPmbFeeModal(true);
                    }}
                    className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
