"use client";

export type LmsStudentTab = "classes" | "sessions" | "materials" | "vicon";

interface StudentLmsSidebarProps {
  activeTab: LmsStudentTab;
  setActiveTab: (tab: LmsStudentTab) => void;
  classesCount: number;
}

export default function StudentLmsSidebar({
  activeTab,
  setActiveTab,
  classesCount,
}: StudentLmsSidebarProps) {
  const menuItems = [
    { id: "classes", label: "Kelas Terdaftar", icon: "📚", badge: classesCount },
    { id: "sessions", label: "Sesi Kuliah (1-16)", icon: "🗓️" },
    { id: "materials", label: "Materi & Tugas Kuliah", icon: "📄" },
    { id: "vicon", label: "Vicon & Presensi Live", icon: "📹" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-[#FED524] text-[#0f487b] flex items-center justify-center font-bold text-base">
          LMS
        </span>
        <div>
          <h1 className="font-bold text-white text-sm">LMS Mahasiswa</h1>
          <p className="text-[10px] text-slate-400">Portal Kuliah Online</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as LmsStudentTab)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === item.id
                ? "bg-[#0f487b] text-white shadow-md"
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
                    ? "bg-[#FED524] text-[#0f487b]"
                    : "bg-slate-800 text-amber-400 border border-slate-700"
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
