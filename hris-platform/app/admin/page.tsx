"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SSO_AUTHORIZE_URL, SSO_CLIENT_ID, SSO_CALLBACK_URL } from "@/lib/client-config";

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Position {
  id: string;
  name: string;
  abbreviation: string;
  functionalAllowance: number;
}

interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: string;
  status: string;
}

interface LeaveType {
  id: string;
  code: string;
  name: string;
  defaultQuotaDays: number;
}

export default function HrisAdminDashboard() {
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [positionsList, setPositionsList] = useState<Position[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [leaveTypesList, setLeaveTypesList] = useState<LeaveType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // Auth state
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectToSSO = () => {
    const array = new Uint32Array(22);
    window.crypto.getRandomValues(array);
    const verifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    sessionStorage.setItem("sso_code_verifier", verifier);
    window.location.href = `${SSO_AUTHORIZE_URL}?client_id=${SSO_CLIENT_ID}&redirect_uri=${encodeURIComponent(SSO_CALLBACK_URL)}&response_type=code&code_challenge=${verifier}&code_challenge_method=plain&scope=openid`;
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/data");
      const data = await res.json();
      if (data.success) {
        setUnits(data.units || []);
        setPositionsList(data.positions || []);
        setEmployeesList(data.employees || []);
        setLeaveTypesList(data.leaveTypes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.success && data.authenticated && data.user && data.user.role === "admin") {
          setAdminUser(data.user);
          setCheckingAuth(false);
          fetchData();
        } else {
          redirectToSSO();
        }
      } catch (err) {
        redirectToSSO();
      }
    };
    checkSession();
  }, []);

  const triggerNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleTriggerSync = async () => {
    triggerNotice("Memulai sinkronisasi database pegawai...");
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Sinkronisasi database pegawai berhasil!");
        fetchData();
      } else {
        triggerNotice("Sinkronisasi gagal: " + data.error);
      }
    } catch (err: any) {
      triggerNotice("Galat jaringan: " + err.message);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        triggerNotice("CSV kosong atau format salah!");
        return;
      }
      triggerNotice(`Memproses import ${lines.length - 1} data pegawai dari CSV...`);
      try {
        const res = await fetch("/api/admin/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });
        const data = await res.json();
        if (data.success) {
          triggerNotice(`Sukses mengimpor ${data.count} data pegawai baru!`);
          fetchData();
        } else {
          triggerNotice("Gagal mengimpor: " + data.error);
        }
      } catch (err: any) {
        triggerNotice("Galat jaringan: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetPassword = async (username: string, name: string) => {
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(`Sukses! Password ${name} sudah direset ke default.`);
      } else {
        triggerNotice(`Gagal mereset: ${data.error}`);
      }
    } catch (err: any) {
      triggerNotice("Galat jaringan.");
    }
  };

  // Filter lists based on search query
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPositions = positionsList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employeesList.filter(e => 
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeaves = leaveTypesList.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FED524] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {checkingAuth ? "Memvalidasi Sesi HRIS..." : "Memuat Data HRIS..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004996] to-[#0a345c] flex items-center justify-center shadow-lg">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Admin Kepegawaian (HRIS)</h1>
            <p className="text-xs text-slate-400 font-medium">Manajemen Struktur Organisasi, Jabatan, & Direktori Pegawai</p>
          </div>
        </div>

        {/* Global Search & Sync Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Cari pegawai, unit, jabatan..."
            className="px-4 py-2 bg-slate-900 border border-slate-800 focus:border-[#004996] rounded-xl text-xs font-semibold text-slate-200 outline-none w-60 transition"
          />
          <button 
            onClick={handleTriggerSync}
            className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#004996]/15 transition"
          >
            🔄 Sync Data
          </button>
          <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center">
            📥 Import Pegawai (CSV)
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />
          </label>
          <Link href="/login" className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition">
            Keluar
          </Link>
        </div>
      </header>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* TABEL 1: UNIT ORGANISASI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🏢</span> Unit Organisasi
            </h2>
            <span className="text-[10px] bg-[#004996]/20 text-[#3b82f6] px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredUnits.length} Unit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Nama Unit</th>
                  <th className="pb-3">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-[#FED524]">{unit.code}</td>
                    <td className="py-3 font-semibold text-slate-300">{unit.name}</td>
                    <td className="py-3 uppercase text-[9px] font-bold text-slate-500">{unit.type}</td>
                  </tr>
                ))}
                {filteredUnits.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada unit yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 2: JABATAN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>👔</span> Daftar Jabatan & Tunjangan
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredPositions.length} Jabatan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">Singkatan</th>
                  <th className="pb-3">Nama Jabatan</th>
                  <th className="pb-3 text-right">Tunjangan Fungsional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-[#FED524]">{pos.abbreviation}</td>
                    <td className="py-3 font-semibold text-slate-300">{pos.name}</td>
                    <td className="py-3 text-right text-slate-300 font-bold">Rp {pos.functionalAllowance.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
                {filteredPositions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada jabatan yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TABEL 3: DIREKTORI PEGAWAI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> Direktori Karyawan
            </h2>
            <span className="text-[10px] bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredEmployees.length} Orang
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">NIP/NIDN</th>
                  <th className="pb-3">Nama Lengkap</th>
                  <th className="pb-3">Tipe</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-slate-300">{emp.employeeNumber}</td>
                    <td className="py-3 font-semibold text-slate-250">{emp.fullName}</td>
                    <td className="py-3 text-xs uppercase font-bold text-slate-500">{emp.employeeType}</td>
                    <td className="py-3 text-center">
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/15 text-emerald-400">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleResetPassword(emp.employeeNumber, emp.fullName)}
                        className="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-450 text-[10px] font-bold rounded-lg transition"
                      >
                        Reset Pass
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">Tidak ada pegawai yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 4: JENIS CUTI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🌴</span> Referensi Jenis Cuti & Kuota
            </h2>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full font-bold uppercase">
              {filteredLeaves.length} Tipe
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Jenis Cuti</th>
                  <th className="pb-3 text-right">Kuota Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 font-mono text-[#FED524]">{leave.code}</td>
                    <td className="py-3 font-semibold text-slate-300">{leave.name}</td>
                    <td className="py-3 text-right text-slate-300 font-bold">{leave.defaultQuotaDays} Hari</td>
                  </tr>
                ))}
                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada jenis cuti yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* TOAST NOTICE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span>✨</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
