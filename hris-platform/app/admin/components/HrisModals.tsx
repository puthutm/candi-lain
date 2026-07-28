"use client";

import { Employee, OrgUnit, Position } from "../page";

interface HrisModalsProps {
  showEmployeeModal: boolean;
  setShowEmployeeModal: (show: boolean) => void;
  employeeForm: {
    employeeNumber: string;
    fullName: string;
    employeeType: "dosen" | "tendik";
    organizationUnitId: string;
    positionId: string;
    rankGroup: string;
    baseSalary: number;
    status: "aktif" | "non_aktif";
    bankName: string;
    bankAccountNumber: string;
  };
  setEmployeeForm: (form: any) => void;
  units: OrgUnit[];
  positionsList: Position[];
  savingEmployee: boolean;
  handleSaveEmployee: (e: React.FormEvent) => void;
  selectedEmployeeDetail: Employee | null;
  setSelectedEmployeeDetail: (emp: Employee | null) => void;
}

export default function HrisModals({
  showEmployeeModal,
  setShowEmployeeModal,
  employeeForm,
  setEmployeeForm,
  units,
  positionsList,
  savingEmployee,
  handleSaveEmployee,
  selectedEmployeeDetail,
  setSelectedEmployeeDetail,
}: HrisModalsProps) {
  return (
    <>
      {/* Employee Registration Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">+ Registrasi Pegawai Baru (Dosen / Tendik)</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">NIP / NIDN</label>
                  <input
                    type="text"
                    required
                    placeholder="0421098501"
                    value={employeeForm.employeeNumber}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block mb-1">Tipe Pegawai</label>
                  <select
                    value={employeeForm.employeeType}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="dosen">Dosen Pengampu</option>
                    <option value="tendik">Tenaga Kependidikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Aulia Rahman, M.Kom."
                  value={employeeForm.fullName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Unit Kerja / Homebase</label>
                  <select
                    value={employeeForm.organizationUnitId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, organizationUnitId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="">Pilih Unit Kerja</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Jabatan Fungsional</label>
                  <select
                    value={employeeForm.positionId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, positionId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="">Pilih Jabatan</option>
                    {positionsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Golongan / Pangkat</label>
                  <input
                    type="text"
                    placeholder="III/c - Penata"
                    value={employeeForm.rankGroup}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, rankGroup: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingEmployee ? "Menyimpan..." : "Simpan Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer Profile Detail */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end fade-in">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Profil Lengkap Pegawai</h3>
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedEmployeeDetail.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedEmployeeDetail.fullName}</h4>
                  <p className="text-[11px] text-purple-700 font-mono font-bold">
                    NIP/NIDN: {selectedEmployeeDetail.employeeNumber}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Tipe SDM:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedEmployeeDetail.employeeType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Pangkat / Golongan:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.rankGroup || "III/c"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Gaji Pokok:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Rp {Number(selectedEmployeeDetail.baseSalary || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Rekening Payroll:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedEmployeeDetail.bankName || "Bank Mandiri"} - {selectedEmployeeDetail.bankAccountNumber || "1230009988"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmployeeDetail(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Tutup Profil
            </button>
          </div>
        </div>
      )}
    </>
  );
}
