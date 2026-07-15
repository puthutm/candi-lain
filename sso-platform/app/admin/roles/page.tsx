"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface Role {
  id: string;
  roleKey: string;
  roleName: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  applicationId: string;
  applicationName: string;
  userCount: number;
  permissionCount: number;
}

interface Application {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  permissionKey: string;
  description: string | null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [appFilter, setAppFilter] = useState("all");
  
  // Modals / Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Add Form State
  const [newRoleKey, setNewRoleKey] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newAppId, setNewAppId] = useState("");

  // Edit Form State
  const [editRoleName, setEditRoleName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);

  // Permission Mapping State
  const [mappingRoleId, setMappingRoleId] = useState<string | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [activePermissions, setActivePermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resApps] = await Promise.all([
        fetch("/api/admin/roles"),
        fetch("/api/admin/clients")
      ]);
      const dataRoles = await resRoles.json();
      const dataApps = await resApps.json();

      if (dataRoles.success) setRoles(dataRoles.roles || []);
      if (dataApps.success) {
        setApplications(dataApps.clients || []);
        if (dataApps.clients?.length > 0) {
          setNewAppId(dataApps.clients[0].id);
        }
      }
    } catch (err) {
      showToast("Kesalahan jaringan saat memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleKey || !newRoleName || !newAppId) {
      showToast("Semua field wajib diisi", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: newAppId,
          roleKey: newRoleKey,
          roleName: newRoleName,
          description: newDesc,
          isDefault: newIsDefault
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Role berhasil ditambahkan!");
        setShowAddForm(false);
        setNewRoleKey("");
        setNewRoleName("");
        setNewDesc("");
        setNewIsDefault(false);
        fetchData();
      } else {
        showToast(data.error || "Gagal menambahkan role", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: editingRole.id,
          roleName: editRoleName,
          description: editDesc,
          isDefault: editIsDefault
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Role berhasil diperbarui!");
        setEditingRole(null);
        fetchData();
      } else {
        showToast(data.error || "Gagal memperbarui role", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role '${name}'?`)) return;

    try {
      const res = await fetch(`/api/admin/roles?roleId=${roleId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        showToast("Role berhasil dihapus!");
        fetchData();
        if (mappingRoleId === roleId) setMappingRoleId(null);
      } else {
        showToast(data.error || "Gagal menghapus role", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const handleOpenPermissions = async (roleId: string) => {
    if (mappingRoleId === roleId) {
      setMappingRoleId(null);
      return;
    }
    setMappingRoleId(roleId);
    setLoadingPermissions(true);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`);
      const data = await res.json();
      if (data.success) {
        setActivePermissions(data.active || []);
        setAvailablePermissions(data.available || []);
      } else {
        showToast(data.error || "Gagal memuat permission", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleTogglePermission = async (permissionId: string, isAssigned: boolean) => {
    if (!mappingRoleId) return;
    try {
      const method = isAssigned ? "DELETE" : "POST";
      const url = isAssigned 
        ? `/api/admin/roles/${mappingRoleId}/permissions?permissionId=${permissionId}` 
        : `/api/admin/roles/${mappingRoleId}/permissions`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: isAssigned ? undefined : JSON.stringify({ permissionId })
      });
      const data = await res.json();

      if (data.success) {
        // Update local list
        if (isAssigned) {
          setActivePermissions(activePermissions.filter(p => p.id !== permissionId));
        } else {
          const perm = availablePermissions.find(p => p.id === permissionId);
          if (perm) setActivePermissions([...activePermissions, perm]);
        }
        // Update count in roles table
        setRoles(roles.map(r => {
          if (r.id === mappingRoleId) {
            return { ...r, permissionCount: isAssigned ? r.permissionCount - 1 : r.permissionCount + 1 };
          }
          return r;
        }));
      } else {
        showToast(data.error || "Gagal mengubah pemetaan permission", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  // Filtered Roles list
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.roleName.toLowerCase().includes(search.toLowerCase()) ||
      role.roleKey.toLowerCase().includes(search.toLowerCase()) ||
      role.applicationName.toLowerCase().includes(search.toLowerCase());
    
    const matchesApp = appFilter === "all" || role.applicationId === appFilter;
    
    return matchesSearch && matchesApp;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="roles" />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Toast */}
        {toastMsg && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-300 max-w-sm flex items-center gap-3 ${
            toastType === "error"
              ? "bg-rose-950/90 border-rose-800 text-rose-200"
              : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
          }`}>
            <span className="text-lg">{toastType === "error" ? "⚠️" : "✅"}</span>
            <p className="text-xs font-bold tracking-wide">{toastMsg}</p>
          </div>
        )}

        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Role Management
              </h1>
              <p className="mt-2 text-slate-400 text-sm">
                Buat dan kelola role untuk kontrol akses berbasis peran di seluruh sistem integrasi aplikasi.
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingRole(null);
              }}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              + Tambah Role
            </button>
          </div>

          {/* Form Create / Edit Role Panel */}
          {(showAddForm || editingRole) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md animate-fadeIn">
              <h2 className="text-lg font-bold text-indigo-400 mb-4">
                {showAddForm ? "1. Tambah Role Baru" : `1. Edit Role: ${editingRole?.roleName}`}
              </h2>
              <form onSubmit={showAddForm ? handleAddRole : handleEditRole} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {showAddForm && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Aplikasi</label>
                      <select
                        value={newAppId}
                        onChange={(e) => setNewAppId(e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
                      >
                        {applications.map(app => (
                          <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role Key</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingRole}
                      value={showAddForm ? newRoleKey : editingRole?.roleKey}
                      onChange={(e) => setNewRoleKey(e.target.value)}
                      placeholder="e.g. super_admin, staff"
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Role</label>
                    <input
                      type="text"
                      required
                      value={showAddForm ? newRoleName : editRoleName}
                      onChange={(e) => showAddForm ? setNewRoleName(e.target.value) : setEditRoleName(e.target.value)}
                      placeholder="e.g. Super Admin"
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deskripsi</label>
                    <input
                      type="text"
                      value={showAddForm ? newDesc : editDesc}
                      onChange={(e) => showAddForm ? setNewDesc(e.target.value) : setEditDesc(e.target.value)}
                      placeholder="Deskripsi singkat peran..."
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 py-3">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={showAddForm ? newIsDefault : editIsDefault}
                      onChange={(e) => showAddForm ? setNewIsDefault(e.target.checked) : setEditIsDefault(e.target.checked)}
                      className="rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isDefault" className="text-xs text-slate-300 select-none cursor-pointer">
                      Jadikan role default untuk user baru
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRole(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition active:scale-95"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
            <input
              type="text"
              placeholder="Cari berdasarkan nama role, key, atau nama aplikasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/50 min-w-[200px]"
            >
              <option value="all">Semua Aplikasi</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          {/* Roles Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02] gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Memuat data role...</span>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="font-semibold text-lg text-white">Tidak Ada Role</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Belum ada role terdaftar atau tidak ada role yang cocok dengan kriteria pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama & Key</th>
                    <th className="p-4">Aplikasi</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4 text-center">User</th>
                    <th className="p-4 text-center">Permission</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredRoles.map(role => (
                    <tr key={role.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{role.roleName}</span>
                          {role.isDefault && (
                            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-500 mt-0.5 text-[10px]">{role.roleKey}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-400">{role.applicationName}</td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">{role.description || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 font-bold text-purple-400 border border-purple-500/20">
                          {role.userCount}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                          {role.permissionCount}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          onClick={() => handleOpenPermissions(role.id)}
                          className={`text-xs font-semibold hover:underline cursor-pointer ${
                            mappingRoleId === role.id ? "text-indigo-400" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {mappingRoleId === role.id ? "Tutup Mappings" : "🔐 Permissions"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRole(role);
                            setEditRoleName(role.roleName);
                            setEditDesc(role.description || "");
                            setEditIsDefault(role.isDefault);
                            setShowAddForm(false);
                          }}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id, role.roleName)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-400 hover:underline cursor-pointer"
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

          {/* Expanded Permission Mapping Panel */}
          {mappingRoleId && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-indigo-400">
                    Konfigurasi Permission untuk Role: {" "}
                    <span className="text-white">
                      {roles.find(r => r.id === mappingRoleId)?.roleName}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hubungkan atau hapus hak akses granular yang dimiliki oleh role ini.
                  </p>
                </div>
                <button
                  onClick={() => setMappingRoleId(null)}
                  className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition"
                >
                  Tutup Mappings
                </button>
              </div>

              {loadingPermissions ? (
                <div className="flex items-center justify-center p-8 gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400">Memuat hak akses...</span>
                </div>
              ) : availablePermissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Belum ada permission terdefinisi untuk aplikasi ini. Silakan buat permission terlebih dahulu di halaman Permission Management.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availablePermissions.map(perm => {
                    const isAssigned = activePermissions.some(ap => ap.id === perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id, isAssigned)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isAssigned
                            ? "bg-indigo-600/10 border-indigo-500/50 hover:bg-indigo-600/20"
                            : "bg-white/[0.01] border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          readOnly
                          className="mt-0.5 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <p className={`font-mono text-[11px] font-semibold ${isAssigned ? "text-indigo-300" : "text-slate-300"}`}>
                            {perm.permissionKey}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                            {perm.description || "Tidak ada deskripsi"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
