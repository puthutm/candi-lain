"use client";

export interface OrgUnit {
  id: string;
  code: string;
  name: string;
  type: string;
}

export interface Position {
  id: string;
  name: string;
  abbreviation: string;
  functionalAllowance: number;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: "dosen" | "tendik";
  organizationUnitId: string;
  positionId: string;
  rankGroup: string;
  baseSalary: number;
  status: "aktif" | "non_aktif" | "pensiun" | "cuti_panjang";
  bankName: string;
  bankAccountNumber: string;
}

interface KaryawanTabProps {
  employeesList: Employee[];
  units: OrgUnit[];
  positionsList: Position[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  karyawanFilterType: "all" | "dosen" | "tendik";
  setKaryawanFilterType: (t: "all" | "dosen" | "tendik") => void;
  karyawanFilterStatus: "all" | "aktif" | "non_aktif";
  setKaryawanFilterStatus: (s: "all" | "aktif" | "non_aktif") => void;
  filterUnitId: string;
  setFilterUnitId: (u: string) => void;
  setShowEmployeeModal: (show: boolean) => void;
  setSelectedEmployeeDetail: (emp: Employee) => void;
  handleExportEmployeesCsv: () => void;
  triggerNotice: (msg: string) => void;
}

export default function KaryawanTab({
  employeesList,
  units,
  positionsList,
  searchQuery,
  setSearchQuery,
  karyawanFilterType,
  setKaryawanFilterType,
  karyawanFilterStatus,
  setKaryawanFilterStatus,
  filterUnitId,
  setFilterUnitId,
  setShowEmployeeModal,
  setSelectedEmployeeDetail,
  handleExportEmployeesCsv,
  triggerNotice,
}: KaryawanTabProps) {
  const filtered = employeesList.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = karyawanFilterType === "all" || emp.employeeType === karyawanFilterType;
    const matchesStatus = karyawanFilterStatus === "all" || emp.status === karyawanFilterStatus;
    const matchesUnit = filterUnitId === "all" || emp.organizationUnitId === filterUnitId;
    return matchesSearch && matchesType && matchesStatus && matchesUnit;
  });

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Data Pegawai Kampus (Dosen & Tendik)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database SDM terintegrasi dengan SIAKAD, BKD, & Payroll.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerNotice("Memperbarui data pegawai...")}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleExportEmployeesCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            📊 Export CSV
          </button>
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            + Registrasi Pegawai Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Cari NIP/NIDN atau Nama..."
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:border-purple-600"
        />
        <select
          value={karyawanFilterType}
          onChange={(e) => setKaryawanFilterType(e.target.value as any)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
        >
          <option value="all">Semua Tipe SDM</option>
          <option value="dosen">Dosen Pengampu</option>
          <option value="tendik">Tenaga Kependidikan</option>
        </select>
        <select
          value={karyawanFilterStatus}
          onChange={(e) => setKaryawanFilterStatus(e.target.value as any)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
        >
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="non_aktif">Non-Aktif</option>
        </select>
        <select
          value={filterUnitId}
          onChange={(e) => setFilterUnitId(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
        >
          <option value="all">Semua Unit Kerja</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Daftar Roster Pegawai</h3>
          <span className="font-mono font-bold text-slate-500">{filtered.length} Pegawai</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">NIP / NIDN</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Unit Kerja</th>
                <th className="px-4 py-3">Jabatan Fungsional</th>
                <th className="px-4 py-3 text-center">Tipe</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const unitObj = units.find((u) => u.id === emp.organizationUnitId);
                const posObj = positionsList.find((p) => p.id === emp.positionId);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-purple-700">{emp.employeeNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{emp.fullName}</td>
                    <td className="px-4 py-3 font-medium">{unitObj?.name || "FTI"}</td>
                    <td className="px-4 py-3">{posObj?.name || "Lektor Kepala"}</td>
                    <td className="px-4 py-3 text-center uppercase font-bold text-[10px]">
                      {emp.employeeType}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${emp.status === "aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEmployeeDetail(emp)}
                        className="text-purple-700 font-bold hover:underline cursor-pointer"
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
