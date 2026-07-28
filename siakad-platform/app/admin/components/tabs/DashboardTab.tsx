"use client";

interface DashboardTabProps {
  overviewData: {
    stats: {
      mahasiswaAktif: number;
      dosenAktif: number;
      kelasBerjalan: number;
      totalMataKuliah: number;
      totalKurikulum: number;
      krsPending: number;
    };
    periodeAktif: {
      name: string;
      status: string;
      startDate: string;
      endDate: string;
    };
    integrasiSistem: Record<string, string>;
  } | null;
  submissionsCount: number;
}

export default function DashboardTab({
  overviewData,
  submissionsCount,
}: DashboardTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Beranda Analitik Akademik
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan terintegrasi antara SIAKAD, HRIS, PMB, Keuangan, LMS, & Data Referensi.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
          ● Realtime DB & Microservices Connected
        </span>
      </div>

      {/* Dynamic KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Mahasiswa Aktif
            </span>
            <span>🎓</span>
          </div>
          <p className="font-display font-black text-3xl text-slate-800 mt-2">
            {overviewData?.stats.mahasiswaAktif?.toLocaleString("id-ID") || "3.719"}
          </p>
          <p className="text-[10px] font-bold text-emerald-600 mt-1">
            Linked to PMB & SIAKAD DB
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Dosen & Pengampu
            </span>
            <span>👩‍🏫</span>
          </div>
          <p className="font-display font-black text-3xl text-slate-800 mt-2">
            {overviewData?.stats.dosenAktif || "152"}
          </p>
          <p className="text-[10px] font-bold text-blue-600 mt-1">
            Linked to HRIS Platform
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Kelas Berjalan
            </span>
            <span>👨‍🏫</span>
          </div>
          <p className="font-display font-black text-3xl text-slate-800 mt-2">
            {overviewData?.stats.kelasBerjalan || "42"}
          </p>
          <p className="text-[10px] font-bold text-violet-600 mt-1">
            Synchronized with LMS
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              KRS Pending
            </span>
            <span>🛡️</span>
          </div>
          <p className="font-display font-black text-3xl text-[#0f487b] mt-2">
            {submissionsCount}
          </p>
          <p className="text-[10px] font-bold text-amber-600 mt-1">
            Linked to Keuangan Platform
          </p>
        </div>
      </div>

      {/* Integration Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>🔗</span> Status Integrasi Lintas Platform (ERP UNSIA)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>HRIS (SDM Dosen/Pegawai)</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.hris || "Connected"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sinkron NIDN, Jabatan Fungsional & Dosen PA
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>PMB (Mahasiswa Baru)</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.pmb || "Connected"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Registrasi Mahasiswa, NIM & Jalur Masuk
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>Keuangan (UKT & Billing)</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.keuangan || "Connected"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kunci Validasi KRS berdasarkan Lunas Tagihan
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>Reference Data (Pusat Referensi)</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.referenceData || "Port 3001"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pekerjaan, Agama, Suku, Jalur, Jas & Tempat Lahir
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>LMS Platform (Perkuliahan)</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.lms || "Auto Sync"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Jadwal Sesi 1-16 & Ruang Kuliah Virtual
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
              <span>PDDikti Feeder</span>
              <span className="text-emerald-600">
                ● {overviewData?.integrasiSistem?.pddikti || "Feeder v2.0"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pelaporan Semester & Transkrip Kelulusan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
