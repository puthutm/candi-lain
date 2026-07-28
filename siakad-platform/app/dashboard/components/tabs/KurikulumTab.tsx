"use client";

export default function KurikulumTab() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Struktur Kurikulum Program Studi (144 SKS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar distribusi mata kuliah wajib & pilihan dari semester 1 hingga semester 8.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-800 text-sm">Kurikulum S1 Informatika (Berlaku 2026)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-[#0f487b] block">Semester 1 (20 SKS)</span>
            <ul className="space-y-1 text-slate-600 font-medium">
              <li>• IF101 · Pemrograman Dasar (4 SKS)</li>
              <li>• IF102 · Matematika Diskrit (3 SKS)</li>
              <li>• MK101 · Pendidikan Pancasila (2 SKS)</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-[#0f487b] block">Semester 2 (20 SKS)</span>
            <ul className="space-y-1 text-slate-600 font-medium">
              <li>• IF201 · Algoritma & Struktur Data (3 SKS)</li>
              <li>• IF203 · Pemrograman Berorientasi Objek (4 SKS)</li>
              <li>• IF205 · Basis Data (3 SKS)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
