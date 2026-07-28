"use client";

export type TabType = "dashboard" | "kurikulum" | "krs" | "khs" | "layanan";

interface StudentSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  studentName: string;
  studentNim: string;
}

export default function StudentSidebar({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  studentName,
  studentNim,
}: StudentSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "kurikulum", label: "Struktur Kurikulum", icon: "🌳" },
    { id: "krs", label: "Pengisian KRS", icon: "📄" },
    { id: "khs", label: "KHS & Hasil Studi", icon: "📋" },
    { id: "layanan", label: "Layanan Akademik", icon: "✉️" },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

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
              SIAKAD Mahasiswa
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FED524] border-2 border-white/20 shadow-md flex items-center justify-center font-bold text-[#0f487b]">
              {studentName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-white truncate text-sm">{studentName}</h3>
              <p className="text-[10px] text-[#FED524] font-bold tracking-wider uppercase font-mono">
                NIM: {studentNim}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-[#FED524]/20 text-[#FED524] font-bold border border-[#FED524]/40"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
