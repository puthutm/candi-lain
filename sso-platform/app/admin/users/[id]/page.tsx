"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  status: "active" | "inactive" | "suspended";
}

interface UserOrgMapping {
  id: string;
  organizationId: string;
  orgName: string;
  orgCode: string;
  orgType: string;
  positionId: string | null;
  positionName: string | null;
  isPrimary: boolean;
}

interface Organization {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  type: string;
  children: Organization[];
}

interface RefItem {
  id: string;
  code: string;
  name: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<User | null>(null);
  const [mappings, setMappings] = useState<UserOrgMapping[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [positions, setPositions] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 5000);
  };

  const fetchData = async () => {
    try {
      // 1. Fetch user details
      const userRes = await fetch(`/api/admin/users/${id}`);
      const userData = await userRes.json();
      if (userData.success && userData.user) {
        setUser(userData.user);
        setStatus(userData.user.status);
      } else {
        showToast("User tidak ditemukan", "error");
        return;
      }

      // 2. Fetch current organization mappings
      const mappingsRes = await fetch(`/api/admin/users/${id}/organization`);
      const mappingsData = await mappingsRes.json();
      if (mappingsData.success) {
        setMappings(mappingsData.list || []);
      }

      // 3. Fetch all organizations for selection
      const orgsRes = await fetch("/api/admin/organizations");
      const orgsData = await orgsRes.json();
      if (Array.isArray(orgsData)) {
        setOrgs(orgsData);
      } else if (orgsData.success && Array.isArray(orgsData.list)) {
        setOrgs(orgsData.list);
      } else {
        setOrgs([]);
      }

      // 4. Fetch Jabatan list from Reference Data API
      const positionsRes = await fetch("/api/reference/JABATAN");
      const positionsData = await positionsRes.json();
      if (positionsData.items && Array.isArray(positionsData.items)) {
        setPositions(positionsData.items);
      }
    } catch (err) {
      console.error(err);
      showToast("Kesalahan jaringan saat memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Status pengguna berhasil diperbarui!");
      } else {
        showToast(data.error || "Gagal memperbarui status", "error");
      }
    } catch (err) {
      showToast("Gagal menghubungi server", "error");
    }
  };

  const handleUnlockAccount = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}/unlock`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Akun berhasil dibuka kembali!");
        setStatus("active");
        if (user) setUser({ ...user, status: "active" });
      } else {
        showToast(data.error || "Gagal membuka kunci akun", "error");
      }
    } catch {
      showToast("Gagal menghubungi server", "error");
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      showToast("Silakan pilih unit organisasi", "error");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}/organization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          positionId: selectedPositionId || null,
          isPrimary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Unit kerja berhasil ditambahkan!");
        setSelectedOrgId("");
        setSelectedPositionId("");
        setIsPrimary(false);
        // Refresh mappings list
        const mappingsRes = await fetch(`/api/admin/users/${id}/organization`);
        const mappingsData = await mappingsRes.json();
        if (mappingsData.success) {
          setMappings(mappingsData.list || []);
        }
      } else {
        showToast(data.error || "Gagal menambahkan unit kerja", "error");
      }
    } catch (err) {
      showToast("Gagal menghubungi server", "error");
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/organization?mappingId=${mappingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Penugasan unit kerja berhasil dihapus!");
        setMappings(mappings.filter(m => m.id !== mappingId));
      } else {
        showToast(data.error || "Gagal menghapus penugasan", "error");
      }
    } catch (err) {
      showToast("Gagal menghubungi server", "error");
    }
  };

  // Helper to flatten and indent org tree for select dropdown
  const getFlattenedOrgs = (list: Organization[], depth = 0): { id: string; name: string }[] => {
    let result: { id: string; name: string }[] = [];
    list.forEach((org) => {
      result.push({
        id: org.id,
        name: "  ".repeat(depth) + (depth > 0 ? "└─ " : "") + org.name + ` (${org.code})`,
      });
      if (org.children && org.children.length > 0) {
        result = [...result, ...getFlattenedOrgs(org.children, depth + 1)];
      }
    });
    return result;
  };

  const flattenedOrgsList = getFlattenedOrgs(orgs);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat profil pengguna...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-rose-500">User Tidak Ditemukan</h1>
          <button
            onClick={() => router.push("/admin/users")}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold hover:bg-indigo-500 transition"
          >
            Kembali ke Manajemen User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="users" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Toast */}
        {toastMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
              toastType === "error"
                ? "bg-rose-950/90 border-rose-800 text-rose-200"
                : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{toastType === "error" ? "⚠️" : "✅"}</span>
              <p className="text-xs font-bold tracking-wide">{toastMsg}</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{user.fullName}</h1>
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded">@{user.username}</span>
              </div>
              <p className="mt-1 text-slate-400 text-sm">
                Detail profil SSO, penugasan organisasi, jabatan, dan kelola status akun
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/users")}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              &larr; Kembali
            </button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Left: Metadata & Status */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
                <h2 className="text-base font-bold mb-4">Detail Pengguna</h2>
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Email</span>
                    <p className="text-slate-300 font-mono select-all truncate bg-slate-900/50 p-2 rounded border border-white/5">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">ID Pengguna</span>
                    <p className="text-slate-300 font-mono select-all truncate bg-slate-900/50 p-2 rounded border border-white/5">{user.id}</p>
                  </div>

                  <form onSubmit={handleUpdateStatus} className="border-t border-white/10 pt-4 space-y-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Kelola Status Akun</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-900/25"
                    >
                      Simpan Status
                    </button>

                    {(user.status === "suspended" || (user.status as string) === "locked") && (
                      <button
                        type="button"
                        onClick={handleUnlockAccount}
                        className="w-full rounded-lg bg-emerald-600/20 border border-emerald-500/30 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <span>🔓</span> Buka Kunci Akun & Reset Counter
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Right: Organization Assignments */}
            <div className="space-y-6 md:col-span-2">
              {/* Existing Assignments list */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Unit Kerja & Jabatan Aktif</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Daftar penugasan instansi dan posisi pegawai yang valid di ekosistem ERP.</p>
                </div>

                {mappings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">Belum ada penugasan unit kerja untuk pengguna ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <th className="pb-3">Unit Organisasi</th>
                          <th className="pb-3">Jabatan</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {mappings.map((map) => (
                          <tr key={map.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3">
                              <span className="font-semibold text-white block">{map.orgName}</span>
                              <span className="text-[9px] font-mono text-slate-500 block">{map.orgCode} | Type: {map.orgType}</span>
                            </td>
                            <td className="py-3 text-slate-300 font-semibold">{map.positionName || "Staf / Tanpa Jabatan"}</td>
                            <td className="py-3">
                              {map.isPrimary ? (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                                  Utama
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteMapping(map.id)}
                                className="px-2 py-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:border-rose-500/30 border border-transparent rounded text-[10px] font-bold transition-all"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Assignment form */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
                <h2 className="text-base font-bold mb-4">Tambah Penugasan Baru</h2>
                <form onSubmit={handleAddMapping} className="space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Organization Unit */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Unit Kerja (Organisasi)</label>
                      <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
                      >
                        <option value="">-- Pilih Unit Kerja --</option>
                        {flattenedOrgsList.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Jabatan Pegawai</label>
                      <select
                        value={selectedPositionId}
                        onChange={(e) => setSelectedPositionId(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
                      >
                        <option value="">-- Tanpa Jabatan (Staf biasa) --</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Primary check */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isPrimaryCheck"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="rounded border-white/10 accent-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="isPrimaryCheck" className="text-slate-300 font-medium select-none cursor-pointer">
                      Jadikan Unit Kerja Utama (Primary)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-900/25"
                  >
                    Simpan Penugasan Unit Kerja
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
