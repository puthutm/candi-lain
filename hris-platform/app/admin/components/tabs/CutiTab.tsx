"use client";

export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeNumber: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "menunggu" | "disetujui" | "ditolak";
  requestedAt: string;
}

interface CutiTabProps {
  leaveRequestsList: LeaveRequest[];
  handleApproveLeave: (id: string, name: string) => void;
  handleRejectLeave: (id: string, name: string) => void;
  triggerNotice: (msg: string) => void;
}

export default function CutiTab({
  leaveRequestsList,
  handleApproveLeave,
  handleRejectLeave,
  triggerNotice,
}: CutiTabProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pengajuan & Persetujuan Cuti Pegawai
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar permohonan izin cuti tahunan, sakit, & cuti melahirkan SDM.
          </p>
        </div>
        <button
          onClick={() => triggerNotice("Memperbarui daftar pengajuan cuti...")}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">NIP / NIDN</th>
              <th className="px-4 py-3">Nama Pegawai</th>
              <th className="px-4 py-3">Jenis Cuti</th>
              <th className="px-4 py-3">Tanggal Izin</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi Persetujuan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaveRequestsList.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-purple-700">{req.employeeNumber}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{req.employeeName}</td>
                <td className="px-4 py-3 font-medium">{req.leaveTypeName}</td>
                <td className="px-4 py-3 font-mono text-[11px]">
                  {req.startDate} s/d {req.endDate}
                </td>
                <td className="px-4 py-3">{req.reason}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      req.status === "disetujui"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "ditolak"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {req.status === "menunggu" ? (
                    <>
                      <button
                        onClick={() => handleRejectLeave(req.id, req.employeeName)}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg hover:bg-rose-100 cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApproveLeave(req.id, req.employeeName)}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Setujui
                      </button>
                    </>
                  ) : (
                    <span className="text-slate-400 font-bold">Selesai</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
