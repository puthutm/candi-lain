"use client";

interface PendaftarPanelProps {
  applicants: any[];
  filterWave: string;
  setFilterWave: (wave: string) => void;
  filterEntryPath: string;
  setFilterEntryPath: (path: string) => void;
  handleExportCsv: () => void;
  triggerToast: (msg: string) => void;
  waves?: any[];
  entryPaths?: any[];
}

export default function PendaftarPanel({
  applicants,
  filterWave,
  setFilterWave,
  filterEntryPath,
  setFilterEntryPath,
  handleExportCsv,
  triggerToast,
  waves = [],
  entryPaths = [],
}: PendaftarPanelProps) {
  // Extract unique wave & path names from applicants as fallback if props empty
  const waveOptions = waves.length > 0 
    ? waves.map((w) => w.name)
    : Array.from(new Set(applicants.map((a) => a.wave).filter(Boolean)));

  const entryPathOptions = entryPaths.length > 0
    ? entryPaths.map((ep) => ep.name)
    : Array.from(new Set(applicants.map((a) => a.entryPath).filter(Boolean)));

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
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>📊</span> Export CSV
        </button>
      </div>

      {/* Dynamic Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs flex-wrap">
        <span className="font-bold text-slate-700">Filter Dinamis:</span>
        
        <select
          value={filterWave}
          onChange={(e) => setFilterWave(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 cursor-pointer"
        >
          <option value="all">Semua Gelombang ({waveOptions.length})</option>
          {waveOptions.map((waveName: string, idx: number) => (
            <option key={idx} value={waveName}>
              {waveName}
            </option>
          ))}
        </select>

        <select
          value={filterEntryPath}
          onChange={(e) => setFilterEntryPath(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 cursor-pointer"
        >
          <option value="all">Semua Jalur Masuk ({entryPathOptions.length})</option>
          {entryPathOptions.map((pathName: string, idx: number) => (
            <option key={idx} value={pathName}>
              {pathName}
            </option>
          ))}
        </select>

        {(filterWave !== "all" || filterEntryPath !== "all") && (
          <button
            onClick={() => {
              setFilterWave("all");
              setFilterEntryPath("all");
            }}
            className="text-blue-600 font-bold hover:underline ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50 items-center">
          <h3 className="font-bold text-slate-800">Tabel Roster Calon Mahasiswa</h3>
          <span className="font-mono font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
            {filtered.length} Pendaftar
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Tidak ada pendaftar yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{item.registrationNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.fullName}
                      <span className="block text-[10px] font-normal text-slate-400">{item.email}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.studyProgram}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700 block">{item.entryPath}</span>
                      <span className="text-[10px] text-slate-400 block">{item.wave}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          item.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.paymentStatus === "lunas" ? "Lunas" : "Belum Bayar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 capitalize">
                      {item.currentStage.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => triggerToast(`Melihat profil pendaftar ${item.fullName}`)}
                        className="text-blue-600 font-bold hover:underline cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
