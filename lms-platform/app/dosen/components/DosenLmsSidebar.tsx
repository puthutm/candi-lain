"use client";

export type LmsDosenTab = "classes" | "sessions" | "materials" | "vicon";

interface DosenLmsSidebarProps {
  activeTab: LmsDosenTab;
  setActiveTab: (tab: LmsDosenTab) => void;
  classesCount: number;
}

export default function DosenLmsSidebar({
  activeTab,
  setActiveTab,
  classesCount,
}: DosenLmsSidebarProps) {
  const menuItems = [
    { id: "classes", label: "Kelas Diampu", icon: "📚", badge: classesCount },
    { id: "sessions", label: "Sesi Pertemuan (1-16)", icon: "🗓️" },
    { id: "materials", label: "Materi & Modul Kuliah", icon: "📄" },
    { id: "vicon", label: "Virtual Meeting Vicon", icon: "📹" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base">
          LMS
        </span>
        <div>
          <h1 className="font-bold text-white text-sm">LMS Dosen</h1>
          <p className="text-[10px] text-slate-400">Portal Perkuliahan Virtual</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as LmsDosenTab)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === item.id
                ? "bg-indigo-600 text-white shadow-md"
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
                    ? "bg-white text-indigo-600"
                    : "bg-slate-800 text-indigo-400 border border-slate-700"
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
