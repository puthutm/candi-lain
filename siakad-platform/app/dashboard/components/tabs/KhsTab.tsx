"use client";

interface KhsTabProps {
  triggerToast: (msg: string) => void;
}

export default function KhsTab({ triggerToast }: KhsTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Kartu Hasil Studi (KHS) & Transkrip
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak hasil evaluasi nilai semester & transkrip akademik sementara.
          </p>
        </div>
        <button
          onClick={() => triggerToast("Mengunduh KHS Semester Ganjil 2026/2027 sebagai PDF...")}
          className="px-4 py-2 bg-[#0f487b] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          📄 Cetak KHS (PDF)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex justify-between">
          <h3 className="font-bold text-slate-800">Hasil Nilai Semester 1 (Ganjil 2026/2027)</h3>
          <span className="font-bold text-emerald-700 font-mono">IPS: 3.85</span>
        </div>
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Mata Kuliah</th>
              <th className="px-4 py-3 text-center">SKS</th>
              <th className="px-4 py-3 text-center">Nilai Angka</th>
              <th className="px-4 py-3 text-center">Huruf</th>
              <th className="px-4 py-3 text-center">Mutu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">IF101</td>
              <td className="px-4 py-3 font-bold text-slate-800">Pemrograman Dasar</td>
              <td className="px-4 py-3 text-center">4</td>
              <td className="px-4 py-3 text-center font-mono">88.5</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-700">A</td>
              <td className="px-4 py-3 text-center font-mono font-bold">16.00</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono font-bold text-[#0f487b]">IF102</td>
              <td className="px-4 py-3 font-bold text-slate-800">Matematika Diskrit</td>
              <td className="px-4 py-3 text-center">3</td>
              <td className="px-4 py-3 text-center font-mono">82.0</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-700">A-</td>
              <td className="px-4 py-3 text-center font-mono font-bold">11.25</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
