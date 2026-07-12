import { db } from "@/db";
import { employees } from "@/db/schema";
import Link from "next/link";

export const revalidate = 0;

export default async function HrisPortalDashboard() {
  const employeesList = await db.select().from(employees).limit(1);
  const userEmployee = employeesList[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FED524] to-[#c29c0f] flex items-center justify-center shadow-lg">
            <span className="text-xl">💼</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Portal Kepegawaian (HRIS Self-Service)</h1>
            <p className="text-xs text-slate-400 font-medium">Informasi Profil, Presensi, & Pengajuan Cuti Mandiri</p>
          </div>
        </div>
        <div>
          <Link href="/login" className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150">
            Keluar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* CARD PROFIL PEGAWAI */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-[#FED524] flex items-center justify-center text-4xl shadow-inner">
            👤
          </div>
          <div className="flex-1 text-center sm:text-left flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-bold text-slate-200">{userEmployee?.fullName || "Nama Pegawai"}</h2>
              <span className="text-[10px] bg-[#004996]/20 text-[#3b82f6] px-2.5 py-0.5 rounded-full font-bold uppercase w-fit mx-auto sm:mx-0">
                {userEmployee?.employeeType || "Dosen"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">NIP: {userEmployee?.employeeNumber || "198305282009121003"}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Status Keaktifan: <span className="text-emerald-400 font-bold uppercase">{userEmployee?.status || "aktif"}</span></p>
          </div>

          <div className="flex flex-col gap-2">
            <button className="px-5 py-2.5 bg-[#004996] hover:bg-[#004996]/90 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-[#004996]/15">
              ⏰ Presensi Masuk
            </button>
            <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition">
              🌴 Ajukan Cuti
            </button>
          </div>
        </div>

        {/* RIWAYAT AKTIVITAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Log Aktivitas Terakhir</h3>
            <p className="text-xs text-slate-400">Riwayat presensi dan cuti bulanan Anda</p>
          </div>

          <div className="py-8 text-center text-slate-500 text-xs font-semibold">
            Belum ada riwayat aktivitas untuk bulan ini.
          </div>
        </div>

      </div>
    </div>
  );
}
