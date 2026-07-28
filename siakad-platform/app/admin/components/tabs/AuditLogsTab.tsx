"use client";

export default function AuditLogsTab() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <h2 className="text-xl font-bold text-slate-800">Audit Logs Sistem Akademik</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200 uppercase">
            <tr>
              <th className="px-5 py-3">Pengguna</th>
              <th className="px-5 py-3">Aksi Log</th>
              <th className="px-5 py-3">Modul</th>
              <th className="px-5 py-3">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-5 py-4 font-bold text-slate-800">Admin BAAK (Bu Ratri)</td>
              <td className="px-5 py-4 font-semibold text-emerald-700">Approve KRS Mahasiswa (26090182)</td>
              <td className="px-5 py-4 font-mono font-bold">SIAKAD Platform</td>
              <td className="px-5 py-4 text-slate-400 font-mono">Hari ini, 01:30:00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
