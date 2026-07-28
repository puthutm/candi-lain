"use client";

interface PendaftarPanelProps {
  applicants: any[];
  filterWave: string;
  setFilterWave: (wave: string) => void;
  filterEntryPath: string;
  setFilterEntryPath: (path: string) => void;
  handleExportCsv: () => void;
  triggerToast: (msg: string) => void;
}

export default function PendaftarPanel({
  applicants,
  filterWave,
  setFilterWave,
  filterEntryPath,
  setFilterEntryPath,
  handleExportCsv,
  triggerToast,
}: PendaftarPanelProps) {
  const filtered = applicants.filter((a) => {
    const matchWave = filterWave === "all" || a.wave === filterWave;
    const matchPath = filterEntryPath === "all" || a.entryPath === filterEntryPath;
    return matchWave && matchPath;
  });

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Data Pendaftar PMB (CRM & Pipeline)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data registrasi calon mahasiswa, status bayar, & tahap seleksi.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          📊 Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
        <span className="font-bold text-slate-700">Filter:</span>
        <select
          value={filterWave}
          onChange={(e) => setFilterWave(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
        >
          <option value="all">Semua Gelombang</option>
          <option value="Gelombang 1 Reguler 2026">Gelombang 1 Reguler 2026</option>
          <option value="Gelombang 2 Beasiswa 2026">Gelombang 2 Beasiswa 2026</option>
        </select>
        <select
          value={filterEntryPath}
          onChange={(e) => setFilterEntryPath(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
        >
          <option value="all">Semua Jalur Masuk</option>
          <option value="Reguler Raport">Reguler Raport</option>
          <option value="Beasiswa Unggulan">Beasiswa Unggulan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Tabel Roster Calon Mahasiswa</h3>
          <span className="font-mono font-bold text-slate-500">{filtered.length} Pendaftar</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">No. Reg</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Prodi Pilihan</th>
                <th className="px-4 py-3">Jalur & Gelombang</th>
                <th className="px-4 py-3 text-center">Status Bayar</th>
                <th className="px-4 py-3 text-center">Tahap Seleksi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{item.registrationNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {item.fullName}
                    <span className="block text-[10px] font-normal text-slate-400">{item.email}</span>
                  </td>
                  <td className="px-4 py-3">{item.studyProgram}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-700">{item.entryPath}</span>
                    <span className="block text-[10px] text-slate-400">{item.wave}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${item.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {item.paymentStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">
                    {item.currentStage.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => triggerToast(`Melihat profil pendaftar ${item.fullName}`)}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
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
