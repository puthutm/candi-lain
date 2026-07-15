"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface Permission {
  id: string;
  permissionKey: string;
  description: string | null;
  applicationId: string;
  applicationName: string;
  roleCount: number;
}

interface Application {
  id: string;
  name: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [appFilter, setAppFilter] = useState("all");

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppId, setNewAppId] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");

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
      const [resPerms, resApps] = await Promise.all([
        fetch("/api/admin/permissions"),
        fetch("/api/admin/clients")
      ]);
      const dataPerms = await resPerms.json();
      const dataApps = await resApps.json();

      if (dataPerms.success) setPermissions(dataPerms.permissions || []);
      if (dataApps.success) {
        setApplications(dataApps.clients || []);
        if (dataApps.clients?.length > 0) {
          setNewAppId(dataApps.clients[0].id);
        }
      }
    } catch {
      showToast("Kesalahan jaringan saat memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppId || !newKey) {
      showToast("Aplikasi dan Key wajib diisi", "error");
      return;
    }

    // Validate resource:action format
    if (!/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(newKey)) {
      showToast("Key harus mengikuti format 'resource:action' (e.g. user:read)", "error");
      return;
    }

    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: newAppId,
          permissionKey: newKey,
          description: newDesc
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast("Permission berhasil ditambahkan!");
        setShowAddForm(false);
        setNewKey("");
        setNewDesc("");
        fetchData();
      } else {
        showToast(data.error || "Gagal menambahkan permission", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const handleDeletePermission = async (permissionId: string, key: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permission '${key}'?`)) return;

    try {
      const res = await fetch(`/api/admin/permissions?permissionId=${permissionId}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        showToast("Permission berhasil dihapus!");
        fetchData();
      } else {
        showToast(data.error || "Gagal menghapus permission", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = 
      perm.permissionKey.toLowerCase().includes(search.toLowerCase()) ||
      (perm.description && perm.description.toLowerCase().includes(search.toLowerCase())) ||
      perm.applicationName.toLowerCase().includes(search.toLowerCase());

    const matchesApp = appFilter === "all" || perm.applicationId === appFilter;

    return matchesSearch && matchesApp;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      <AdminSidebar activeTab="permissions" />

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
                Permission Management
              </h1>
              <p className="mt-2 text-slate-400 text-sm">
                Definisikan permission granular untuk kontrol akses fungsional di integrasi aplikasi.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              {showAddForm ? "Batal" : "+ Tambah Permission"}
            </button>
          </div>

          {/* Form Add Panel */}
          {showAddForm && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-md animate-fadeIn">
              <h2 className="text-lg font-bold text-indigo-400 mb-4">1. Tambah Permission Baru</h2>
              <form onSubmit={handleAddPermission} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aplikasi</label>
                    <select
                      value={newAppId}
                      onChange={(e) => setNewAppId(e.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      {applications.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permission Key</label>
                    <input
                      type="text"
                      required
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Format: resource:action (e.g. invoice:approve, document:read)"
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deskripsi</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Deskripsi fungsi permission ini..."
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition active:scale-95"
                  >
                    Simpan Permission
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
            <input
              type="text"
              placeholder="Cari berdasarkan key, deskripsi, atau nama aplikasi..."
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

          {/* Permissions Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02] gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Memuat data permission...</span>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="font-semibold text-lg text-white">Tidak Ada Permission</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Belum ada permission terdefinisi atau tidak ada yang sesuai dengan filter pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Permission Key</th>
                    <th className="p-4">Aplikasi</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4 text-center">Digunakan di Role</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredPermissions.map(perm => (
                    <tr key={perm.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-mono text-[11px] font-semibold text-indigo-400">
                        {perm.permissionKey}
                      </td>
                      <td className="p-4 font-medium text-slate-400">{perm.applicationName}</td>
                      <td className="p-4 text-slate-400 max-w-md truncate">{perm.description || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-bold text-indigo-400 border border-indigo-500/20">
                          {perm.roleCount} Role
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeletePermission(perm.id, perm.permissionKey)}
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
        </div>
      </main>
    </div>
  );
}
