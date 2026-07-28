"use client";

export type AdminPanelType =
  | "dashboard"
  | "monitoring"
  | "pendaftar"
  | "seleksi"
  | "verifikasi"
  | "pembayaran"
  | "komunikasi"
  | "gelombang"
  | "mahasiswa"
  | "pengaturan";

interface PmbSidebarProps {
  activePanel: AdminPanelType;
  setActivePanel: (panel: AdminPanelType) => void;
  applicantsCount: number;
  unverifiedDocsCount: number;
}

export default function PmbSidebar({
  activePanel,
  setActivePanel,
  applicantsCount,
  unverifiedDocsCount,
}: PmbSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard Ringkasan", icon: "📊" },
    { id: "monitoring", label: "Monitoring Pendaftar", icon: "📈" },
    { id: "pendaftar", label: "Data Pendaftar (CRM)", icon: "👥", badge: applicantsCount },
    { id: "seleksi", label: "Seleksi & Hasil Ujian", icon: "📝" },
    { id: "verifikasi", label: "Verifikasi Berkas", icon: "📂", badge: unverifiedDocsCount },
    { id: "pembayaran", label: "Verifikasi Pembayaran", icon: "💳" },
    { id: "komunikasi", label: "Pesan & Pengumuman", icon: "📢" },
    { id: "gelombang", label: "Manajemen Gelombang", icon: "🗓️" },
    { id: "mahasiswa", label: "Daftar Ulang & NIM", icon: "🎓" },
    { id: "pengaturan", label: "Pengaturan Biaya", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          P
        </span>
        <div>
          <h1 className="font-bold text-white text-sm">PMB Admin</h1>
          <p className="text-[10px] text-slate-400">Portal Penerimaan Maba</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id as AdminPanelType)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activePanel === item.id
                ? "bg-blue-600 text-white shadow-md"
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
                  activePanel === item.id
                    ? "bg-white text-blue-600"
                    : "bg-slate-800 text-blue-400 border border-slate-700"
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
