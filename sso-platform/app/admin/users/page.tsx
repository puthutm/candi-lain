"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: "active" | "inactive" | "suspended";
  lastLogin: string | null;
  createdAt: string;
}

interface Filters {
  search: string;
  status: "all" | "active" | "inactive" | "suspended";
  sortBy: "newest" | "oldest" | "name";
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    sortBy: "newest",
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        showToast("Gagal memuat data pengguna", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (filters.search) {
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(filters.search.toLowerCase()) ||
          u.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          u.fullName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((u) => u.status === filters.status);
    }

    // Sort
    if (filters.sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === "name") {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    setFilteredUsers(result);
  }, [users, filters]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 5000);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        showToast("Status pengguna berhasil diperbarui");
      } else {
        showToast(data.error || "Gagal mengubah status", "error");
      }
    } catch (err) {
      showToast("Kesalahan jaringan", "error");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "inactive":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
      case "suspended":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
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

        <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
            <p className="mt-2 text-slate-400">
              Kelola pengguna SSO dan kontrol akses mereka ke aplikasi
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/users/new")}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/25"
          >
            + Tambah User
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, atau username..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-12">
            <p className="text-slate-400">Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold">Tidak ada pengguna</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              {filters.search || filters.status !== "all"
                ? "Tidak ada pengguna yang sesuai dengan filter Anda"
                : "Belum ada pengguna terdaftar"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/10"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Nama</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Username</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Last Login</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Terdaftar</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-white/10"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">{user.fullName}</td>
                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-slate-300">@{user.username}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.status}
                        onChange={(e) => handleChangeStatus(user.id, e.target.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition-all ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {user.lastLogin ? formatDate(user.lastLogin) : "Belum pernah login"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors"
                      >
                        Edit →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Stats */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 text-sm text-slate-400">
            Menampilkan {filteredUsers.length} dari {users.length} pengguna
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
