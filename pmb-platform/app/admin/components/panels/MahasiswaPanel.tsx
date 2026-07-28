"use client";

interface MahasiswaPanelProps {
  acceptedApplicants: any[];
  handleExportToSiakad: (applicantId: string) => void;
  triggerToast: (msg: string) => void;
}

export default function MahasiswaPanel({
  acceptedApplicants,
  handleExportToSiakad,
  triggerToast,
}: MahasiswaPanelProps) {
  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Mahasiswa Diterima & Generator NIM (SIAKAD Sync)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Terbitkan Nomor Induk Mahasiswa (NIM) & ekspor otomatis data registrasi ke SIAKAD Platform.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">No. Reg</th>
              <th className="px-4 py-3">Nama Mahasiswa</th>
              <th className="px-4 py-3">Prodi Diterima</th>
              <th className="px-4 py-3 text-center">NIM Generasi</th>
              <th className="px-4 py-3 text-right">Aksi Sync SIAKAD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {acceptedApplicants.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-blue-700">{a.registrationNumber}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{a.fullName}</td>
                <td className="px-4 py-3">{a.studyProgram}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                  {a.nim || "26090182 (Generated)"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleExportToSiakad(a.id)}
                    className="px-3.5 py-1.5 bg-[#0f487b] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    🚀 Export to SIAKAD
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
