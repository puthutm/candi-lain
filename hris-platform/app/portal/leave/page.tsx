"use client";

import React, { useState, useEffect } from "react";
import AppSwitcher from "@/app/components/AppSwitcher";

interface LeaveType {
  id: string;
  code: string;
  name: string;
  defaultQuotaDays: number;
}

interface LeaveRequest {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "menunggu" | "disetujui" | "ditolak";
  requestedAt: string;
}

export default function EmployeeLeavePortal() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchPortalData = async () => {
    try {
      const res = await fetch("/api/portal/leave");
      const data = await res.json();
      if (data.success) {
        setEmployeeId(data.employeeId || "");
        setRequests(data.requests || []);
        setLeaveTypes(data.leaveTypes || []);
        if (data.leaveTypes?.length > 0) {
          setForm((prev) => ({ ...prev, leaveTypeId: data.leaveTypes[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason) {
      setToast("Harap lengkapi semua isian formulir");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          ...form,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast("Pengajuan cuti berhasil dikirim!");
        setForm((prev) => ({ ...prev, startDate: "", endDate: "", reason: "" }));
        await fetchPortalData();
      } else {
        setToast(data.error || "Gagal mengajukan cuti");
      }
    } catch (err: any) {
      setToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌴</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Portal Cuti Pegawai</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Pengajuan Cuti & Pemantauan Kuota Mandiri (UNSIA HRIS)</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/portal/payslips"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              📄 Slip Gaji Saya
            </a>
            <AppSwitcher />
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Pengajuan Cuti */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>✍️</span> Form Pengajuan Cuti
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Jenis Cuti</label>
                <select
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Kuota: {t.defaultQuotaDays} hari)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mulai Tgl</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Selesai Tgl</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Alasan Cuti</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Jelaskan alasan keperluan pengajuan cuti..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {submitting ? "Mengirim..." : "🚀 Kirim Pengajuan"}
              </button>
            </form>
          </div>

          {/* Tabel Riwayat Pengajuan Cuti */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Riwayat Pengajuan Cuti Saya
            </h2>

            {loading ? (
              <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Memuat data cuti...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Belum ada pengajuan cuti yang dikirim.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="pb-3 px-2">Jenis Cuti</th>
                      <th className="pb-3 px-2">Periode Tanggal</th>
                      <th className="pb-3 px-2">Alasan</th>
                      <th className="pb-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-2 font-bold text-white">{r.leaveTypeName}</td>
                        <td className="py-3 px-2 font-mono text-slate-400">
                          {r.startDate} s.d. {r.endDate}
                        </td>
                        <td className="py-3 px-2 truncate max-w-xs">{r.reason}</td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              r.status === "disetujui"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : r.status === "ditolak"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {r.status === "disetujui" ? "APPROVED" : r.status === "ditolak" ? "REJECTED" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl z-50">
          ✨ {toast}
        </div>
      )}
    </div>
  );
}
