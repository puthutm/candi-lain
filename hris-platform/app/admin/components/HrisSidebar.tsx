"use client";

export type HrisTabType =
  | "dashboard"
  | "karyawan"
  | "presensi"
  | "cuti"
  | "struktur"
  | "payroll"
  | "pengaturan";

interface HrisSidebarProps {
  activeTab: HrisTabType;
  setActiveTab: (tab: HrisTabType) => void;
  employeesCount: number;
  leaveRequestsCount: number;
}

export default function HrisSidebar({
  activeTab,
  setActiveTab,
  employeesCount,
  leaveRequestsCount,
}: HrisSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard SDM", icon: "📊" },
    { id: "karyawan", label: "Data Pegawai (Dosen/Tendik)", icon: "👥", badge: employeesCount },
    { id: "presensi", label: "Presensi & BKD Dosen", icon: "⏰" },
    { id: "cuti", label: "Pengajuan Cuti", icon: "⏸️", badge: leaveRequestsCount },
    { id: "struktur", label: "Struktur Organisasi & Unit", icon: "🏢" },
    { id: "payroll", label: "Penggajian & Slip PDF", icon: "💸" },
    { id: "pengaturan", label: "Pengaturan Komponen", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-base">
          HR
        </span>
        <div>
          <h1 className="font-bold text-white text-sm">HRIS SDM</h1>
          <p className="text-[10px] text-slate-400">Portal SDM & Kepegawaian</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as HrisTabType)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === item.id
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === item.id
                    ? "bg-white text-purple-600"
                    : "bg-slate-800 text-purple-400 border border-slate-700"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
