"use client";

import { StudentInvoice } from "../../page";

interface PenerimaanTabProps {
  invoices: StudentInvoice[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  invoiceFilterStatus: "all" | "outstanding" | "lunas";
  setInvoiceFilterStatus: (status: "all" | "outstanding" | "lunas") => void;
  handleExportInvoicesCsv: () => void;
  triggerNotice: (msg: string) => void;
}

export default function PenerimaanTab({
  invoices,
  searchQuery,
  setSearchQuery,
  invoiceFilterStatus,
  setInvoiceFilterStatus,
  handleExportInvoicesCsv,
  triggerNotice,
}: PenerimaanTabProps) {
  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.academicPeriodLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Tagihan & Penerimaan UKT Mahasiswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring pembayaran SPP, BOP, & verifikasi kunci registrasi KRS.
          </p>
        </div>
        <button
          onClick={handleExportInvoicesCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          📊 Export CSV Tagihan
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Cari no. invoice atau periode..."
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-[#0f487b]"
        />
        <select
          value={invoiceFilterStatus}
          onChange={(e) => setInvoiceFilterStatus(e.target.value as any)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
        >
          <option value="all">Semua Status</option>
          <option value="lunas">Lunas</option>
          <option value="outstanding">Ada Tunggakan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Daftar Invoice Mahasiswa</h3>
          <span className="font-mono font-bold text-slate-500">{filtered.length} Invoice</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">User / NIM</th>
                <th className="px-4 py-3">Jenis Tagihan</th>
                <th className="px-4 py-3 font-mono">Periode</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{inv.studentUserId}</td>
                  <td className="px-4 py-3">{inv.invoiceType}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{inv.academicPeriodLabel}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    Rp {Number(inv.totalAmount || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        inv.status === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {inv.status === "lunas" ? "Lunas" : "Ada Tunggakan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => triggerNotice(`Verifikasi tagihan ${inv.invoiceNumber}`)}
                      className="text-[#0f487b] font-bold hover:underline cursor-pointer"
                    >
                      Detail →
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
