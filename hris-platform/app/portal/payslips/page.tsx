"use client";

import React, { useState, useEffect } from "react";
import AppSwitcher from "@/app/components/AppSwitcher";

interface Payslip {
  id: string;
  payrollRunId: string;
  period: string;
  employeeName: string;
  employeeNumber: string;
  grossSalary: number;
  pph21Amount: number;
  bpjsKesehatanAmount: number;
  bpjsKetenagakerjaanAmount: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  generatedAt: string;
}

export default function EmployeePayslipPortal() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const fetchPayslips = async () => {
    try {
      const res = await fetch("/api/admin/payroll/run");
      const data = await res.json();
      if (data.success && data.runs?.length > 0) {
        // Fetch published payslips
        const latestRun = data.runs[0];
        const psRes = await fetch(`/api/admin/payroll/payslips?runId=${latestRun.id}`);
        const psData = await psRes.json();
        if (psData.success) {
          setPayslips(psData.payslips || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPayslipDetail = async (runId: string, employeeId: string) => {
    try {
      const res = await fetch(`/api/portal/payslip/${runId}?employeeId=${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPayslip(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Portal Slip Gaji Mandiri</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Akses & Unduh Slip Gaji Resmi Pegawai UNSIA</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/portal/leave"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              🌴 Portal Cuti
            </a>
            <AppSwitcher />
          </div>
        </header>

        {/* Payslips Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧾</span> Daftar Slip Gaji Saya
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat riwayat slip gaji...</div>
          ) : payslips.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Belum ada slip gaji yang diterbitkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 px-2">Nama Pegawai</th>
                    <th className="pb-3 px-2">NIP / NIDN</th>
                    <th className="pb-3 px-2">Gaji Bruto</th>
                    <th className="pb-3 px-2">Potongan Pajak & BPJS</th>
                    <th className="pb-3 px-2">Gaji Netto (THP)</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {payslips.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-2 font-bold text-white">{ps.employeeName}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{ps.employeeNumber}</td>
                      <td className="py-3 px-2 font-mono text-slate-200">
                        Rp {(ps.grossSalary || ps.baseSalary || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 font-mono text-rose-400">
                        -Rp {(ps.totalDeductions || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-emerald-400">
                        Rp {(ps.netSalary || ps.baseSalary || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => openPayslipDetail(ps.payrollRunId, ps.id)}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-bold rounded-lg transition"
                        >
                          👁️ Detail Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Payslip Detail */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Slip Gaji Resmi UNSIA</h3>
                <p className="text-xs text-slate-400 mt-0.5">Periode: {selectedPayslip.period || "Mei 2026"}</p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Nama Pegawai</span>
                <span className="font-bold text-white">{selectedPayslip.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">NIP / NIDN</span>
                <span className="font-mono text-white">{selectedPayslip.employeeNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Gaji Bruto</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Rp {(selectedPayslip.grossSalary || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">PPh21 TER</span>
                <span className="font-mono text-rose-400">
                  -Rp {(selectedPayslip.pph21Amount || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">BPJS Kesehatan (1%)</span>
                <span className="font-mono text-rose-400">
                  -Rp {(selectedPayslip.bpjsKesehatanAmount || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">BPJS Ketenagakerjaan (3%)</span>
                <span className="font-mono text-rose-400">
                  -Rp {(selectedPayslip.bpjsKetenagakerjaanAmount || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-bold text-slate-300">Gaji Netto (THP)</span>
                <span className="font-mono text-lg font-black text-emerald-400">
                  Rp {(selectedPayslip.netSalary || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                🖨️ Cetak / Simpan PDF Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
