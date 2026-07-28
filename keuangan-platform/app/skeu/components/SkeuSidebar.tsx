"use client";

export type SkeuTabType =
  | "beranda"
  | "penerimaan"
  | "pmb"
  | "beasiswa"
  | "pengeluaran"
  | "akuntansi"
  | "pengaturan";

interface SkeuSidebarProps {
  activeTab: SkeuTabType;
  setActiveTab: (tab: SkeuTabType) => void;
  invoicesCount: number;
}

export default function SkeuSidebar({
  activeTab,
  setActiveTab,
  invoicesCount,
}: SkeuSidebarProps) {
  const menuItems = [
    { id: "beranda", label: "Beranda Keuangan", icon: "📊" },
    { id: "penerimaan", label: "Tagihan & UKT Mhs", icon: "💳", badge: invoicesCount },
    { id: "pmb", label: "Tarif Formulir PMB", icon: "📝" },
    { id: "beasiswa", label: "Beasiswa & Keringanan", icon: "🎁" },
    { id: "pengeluaran", label: "Pengeluaran & Kas", icon: "📤" },
    { id: "akuntansi", label: "Akuntansi & COA", icon: "📑" },
    { id: "pengaturan", label: "Tarif SPP per Prodi", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-[#FED524] text-[#0f487b] flex items-center justify-center font-bold text-base">
          KEU
        </span>
        <div>
          <h1 className="font-bold text-white text-sm">Console SKEU</h1>
          <p className="text-[10px] text-slate-400">Platform Keuangan Kampus</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as SkeuTabType)}
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
