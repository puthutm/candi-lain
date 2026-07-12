import { db } from "@/db";
import { studentInvoices } from "@/db/schema";
import Link from "next/link";

export const revalidate = 0;

export default async function SkeumDashboard() {
  const invoicesList = await db.select().from(studentInvoices).limit(5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FED524] to-[#c29c0f] flex items-center justify-center shadow-lg">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Portal Keuangan Mahasiswa (SKEUM)</h1>
            <p className="text-xs text-slate-400 font-medium">Informasi Tagihan & Riwayat Pembayaran Kuliah</p>
          </div>
        </div>
        <div>
          <Link href="/login" className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150">
            Keluar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Daftar Tagihan Aktif</h2>
              <p className="text-xs text-slate-400">Bayar UKT/Pembayaran Kuliah Anda di bawah ini</p>
            </div>
            <span className="text-xs font-bold bg-[#FED524]/20 text-[#FED524] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Metode Virtual Account
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {invoicesList.map((inv) => (
              <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-850/20 px-4 rounded-xl transition">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{inv.invoiceNumber}</span>
                    <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">{inv.invoiceType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">Tagihan Semester ({inv.academicPeriodLabel})</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Batas Waktu: {inv.dueDate}</p>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-semibold block">Total Bayar</span>
                    <span className="text-sm font-black text-[#FED524]">Rp {Number(inv.totalAmount).toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase ${
                      inv.status === "lunas" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {inv.status}
                    </span>
                    {inv.status !== "lunas" && (
                      <button className="px-4 py-2 bg-[#004996] hover:bg-[#004996]/90 text-white font-bold text-[10px] rounded-xl transition shadow-md shadow-[#004996]/20">
                        Bayar Sekarang
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {invoicesList.length === 0 && (
              <div className="py-8 text-center text-slate-500 font-medium">
                Belum ada tagihan terdaftar untuk akun Anda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
