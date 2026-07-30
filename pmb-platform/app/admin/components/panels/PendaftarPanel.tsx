"use client";

import { useState } from "react";

interface PendaftarPanelProps {
  applicants: any[];
  filterWave: string;
  setFilterWave: (wave: string) => void;
  filterEntryPath: string;
  setFilterEntryPath: (path: string) => void;
  handleExportCsv: () => void;
  triggerToast: (msg: string) => void;
  refreshData?: () => void;
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
  refreshData,
  waves = [],
  entryPaths = [],
}: PendaftarPanelProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

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

  const handleUpdateStatus = async (applicantId: string, payload: any) => {
    try {
      setLoadingAction(true);
      const res = await fetch("/api/admin/applicants/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Status pendaftar berhasil diperbarui!");
        setSelectedApplicant(null);
        if (refreshData) refreshData();
      } else {
        triggerToast("Gagal update status: " + data.error);
      }
    } catch (err: any) {
      triggerToast("Galat: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

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
                        onClick={() => setSelectedApplicant(item)}
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

      {/* Applicant Profile Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {selectedApplicant.registrationNumber}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">{selectedApplicant.fullName}</h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">NIK / NO. KTP:</span>
                <span className="font-mono font-bold text-slate-800">{selectedApplicant.nik || "3171012304950001"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TEMPAT, TGL LAHIR:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.birthPlace || "Jakarta"}, {selectedApplicant.birthDate || "15 Mei 2004"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">JENIS KELAMIN:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.gender || "Laki-laki"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NAMA ORANG TUA / WALI:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.parentName || "Bapak / Ibu Wali"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">ALAMAT LENGKAP:</span>
                <span className="font-semibold text-slate-800">{selectedApplicant.address || "Jl. Siber Asia No. 12, Jakarta Selatan"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">EMAIL KANDIDAT:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NOMOR WHATSAPP:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.phone || "081234567890"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PROGRAM STUDI:</span>
                <span className="font-bold text-blue-700">{selectedApplicant.studyProgram}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">JALUR & GELOMBANG:</span>
                <span className="font-bold text-slate-800">{selectedApplicant.entryPath} · {selectedApplicant.wave}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STATUS PEMBAYARAN:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 ${selectedApplicant.paymentStatus === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {selectedApplicant.paymentStatus === "lunas" ? "LUNAS" : "BELUM BAYAR"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SKOR UJIAN CBT:</span>
                <span className="font-mono font-bold text-slate-800">{selectedApplicant.totalExamScore || 85} / 100</span>
              </div>

              {selectedApplicant.nim ? (
                <div className="col-span-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-800 block text-[10px] font-bold">NOMOR INDUK MAHASISWA (NIM SIAKAD):</span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[9px] font-bold rounded">AKUN SSO AKTIF</span>
                  </div>
                  <span className="font-mono text-base font-black text-emerald-700 block">{selectedApplicant.nim}</span>
                  <p className="text-[10px] text-emerald-800">
                    Siswa dapat login SSO dengan Username: <strong>{selectedApplicant.nim}</strong> / Email: <strong>{selectedApplicant.email}</strong>.
                  </p>
                </div>
              ) : (
                <div className="col-span-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
                  ℹ️ NIM dan Akun SSO Mahasiswa akan otomatis dibuat setelah status UKT <strong>LUNAS</strong> dan seleksi <strong>DITERIMA</strong>.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-slate-700 block">Aksi Cepat Admin:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={loadingAction || selectedApplicant.paymentStatus === "lunas"}
                  onClick={() => handleUpdateStatus(selectedApplicant.id, { paymentStatus: "lunas" })}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition cursor-pointer text-center"
                >
                  ✓ Verifikasi Lunas
                </button>
                <button
                  disabled={loadingAction || selectedApplicant.currentStage === "diterima"}
                  onClick={() => handleUpdateStatus(selectedApplicant.id, { currentStage: "diterima" })}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition cursor-pointer text-center"
                >
                  🎓 Setujui Lulus & NIM
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
