"use client";

import { PayrollRun, Payslip } from "../../page";

interface PayrollTabProps {
  payrollRunsList: PayrollRun[];
  payslipsList: Payslip[];
  triggerNotice: (msg: string) => void;
}

export default function PayrollTab({
  payrollRunsList,
  payslipsList,
  triggerNotice,
}: PayrollTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Penggajian Pegawai (Payroll Engine & Slip PDF)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5 Tahap Otomatisasi Gaji (Persiapan, Validasi BKD, Kalkulasi, Persetujuan, Slip PDF).
          </p>
        </div>
        <button
          onClick={() => triggerNotice("Proses payroll bulan berjalan berhasil dijalankan!")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
        >
          🚀 Jalankan Run Payroll
        </button>
      </div>

      {/* 5 Sequential Steps Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>⚙️</span> 5 Tahap Sequential Pemrosesan Payroll
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
          <span className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 1. Persiapan Data</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 2. Validasi BKD</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-emerald-600 text-white shrink-0">✓ 3. Kalkulasi Gaji</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-purple-600 text-white shrink-0 shadow-md">⏱ 4. Persetujuan Direksi</span>
          <span className="text-slate-400 font-mono">→</span>
          <span className="px-3 py-2 rounded-xl bg-slate-200 text-slate-600 shrink-0">5. Disburse Slip PDF</span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Daftar Slip Gaji Pegawai</h3>
          <span className="font-mono font-bold text-slate-500">{payslipsList.length} Slip Gaji</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">NIP / NIDN</th>
                <th className="px-4 py-3">Nama Pegawai</th>
                <th className="px-4 py-3 font-mono">Periode</th>
                <th className="px-4 py-3 text-right">Gaji Pokok</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payslipsList.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-purple-700">{slip.employeeNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{slip.employeeName}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{slip.period}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    Rp {Number(slip.baseSalary || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      ● {slip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => triggerNotice(`Mengunduh Slip Gaji PDF milik ${slip.employeeName}`)}
                      className="text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      📄 Download Slip PDF
                    </button>
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
