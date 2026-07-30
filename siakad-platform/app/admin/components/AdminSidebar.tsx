"use client";

export type AdminTab =
  | "dashboard"
  | "prodi"
  | "tahun_ajaran"
  | "periode"
  | "kurikulum"
  | "matakuliah"
  | "kelas"
  | "jadwal"
  | "nilai"
  | "krs_validation"
  | "mahasiswa"
  | "dosen"
  | "persuratan"
  | "pddikti"
  | "audit"
  | "laporan"
  | "pengaturan";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  adminUser: { name: string; username: string; role: string } | null;
  submissionsCount: number;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  adminUser,
  submissionsCount,
}: AdminSidebarProps) {
  const initials = adminUser
    ? adminUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const handleTabClick = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-gradient-to-b from-[#0f487b] to-[#0a345c] flex-col flex z-40 shadow-xl shrink-0 h-full fixed lg:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#FED524] flex items-center justify-center font-bold text-[#0f487b]">
              SIA
            </span>
            <span className="text-white font-bold tracking-tight text-sm">
              Admin Akademik
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-white truncate text-sm">
                {adminUser?.name || "Admin"}
              </h3>
              <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase font-mono">
                {adminUser?.role === "admin"
                  ? "Super Admin BAAK"
                  : `Dosen (${adminUser?.role})`}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          {/* Beranda */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-2">
            Beranda
          </p>
          <button
            onClick={() => handleTabClick("dashboard")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "dashboard"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </button>

          {/* Master Akademik */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">
            Master Akademik
          </p>
          {[
            { id: "prodi", icon: "🏛️", label: "Program Studi (Prodi)" },
            { id: "tahun_ajaran", icon: "📅", label: "Tahun Ajaran" },
            { id: "periode", icon: "🗓️", label: "Periode Akademik" },
            { id: "kurikulum", icon: "🌳", label: "Kurikulum" },
            { id: "matakuliah", icon: "📚", label: "Mata Kuliah" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as AdminTab)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Operasional */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">
            Operasional
          </p>
          <button
            onClick={() => handleTabClick("kelas")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "kelas"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👨‍🏫</span>
            <span>Kelas Kuliah</span>
          </button>

          {[
            { id: "jadwal", icon: "⏰", label: "Jadwal & Sesi" },
            { id: "nilai", icon: "📋", label: "Nilai & KHS" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as AdminTab)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => handleTabClick("krs_validation")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "krs_validation"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🛡️</span>
            <span>Validasi KRS Mahasiswa</span>
            {submissionsCount > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {submissionsCount}
              </span>
            )}
          </button>

          {/* SDM & Mahasiswa */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">
            SDM & Mahasiswa
          </p>
          <button
            onClick={() => handleTabClick("mahasiswa")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "mahasiswa"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🎓</span>
            <span>Data Mahasiswa</span>
          </button>

          <button
            onClick={() => handleTabClick("dosen")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "dosen"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👩‍🏫</span>
            <span>Dosen & Pengampu</span>
          </button>

          <button
            onClick={() => handleTabClick("persuratan")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
              activeTab === "persuratan"
                ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>✉️</span>
            <span>Persuratan</span>
            <span className="ml-auto px-1.5 py-0.5 bg-rose-500/20 text-rose-300 text-[9px] font-bold rounded">
              7
            </span>
          </button>

          {/* Lain-lain & Integrasi */}
          <p className="px-3 text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1.5 mt-4">
            Integrasi & System
          </p>
          {[
            { id: "pddikti", icon: "☁️", label: "Sinkronisasi PDDikti" },
            { id: "audit", icon: "📝", label: "Audit Logs" },
            { id: "laporan", icon: "📊", label: "Laporan" },
            { id: "pengaturan", icon: "⚙️", label: "Pengaturan" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as AdminTab)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
