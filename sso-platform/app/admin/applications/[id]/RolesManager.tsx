"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Role {
  id: string;
  roleKey: string;
  roleName: string;
  description: string | null;
  isDefault: boolean;
}

interface RolesManagerProps {
  appId: string;
  initialRoles: Role[];
}

export default function RolesManager({ appId, initialRoles }: RolesManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showAddForm, setShowAddForm] = useState(false);
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleKey || !roleName) {
      triggerNotice("Role Key and Role Name are required", true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, roleName, description, isDefault }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Role added successfully!");
        setRoles([...roles, data.role]);
        setRoleKey("");
        setRoleName("");
        setDescription("");
        setIsDefault(false);
        setShowAddForm(false);
        router.refresh();
      } else {
        triggerNotice(data.error || "Failed to add role", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete role '${name}'?`)) {
      return;
    }

    setDeletingId(roleId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/roles?roleId=${roleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Role deleted successfully!");
        setRoles(roles.filter(r => r.id !== roleId));
        router.refresh();
      } else {
        triggerNotice(data.error || "Failed to delete role", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
      {notice && (
        <div className={`fixed bottom-5 right-5 z-50 px-6 py-4 rounded-2xl border shadow-2xl transition-all duration-350 max-w-sm ${
          isError 
            ? "bg-rose-950/90 border-rose-800 text-rose-200" 
            : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{isError ? "⚠️" : "💡"}</span>
            <p className="text-xs font-bold tracking-wide">{notice}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-base font-bold">Application Roles</h2>
          <p className="text-xs text-slate-400 mt-0.5">Application-specific dynamic roles keys for token mappings.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
        >
          {showAddForm ? "Cancel" : "+ Add Role"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddRole} className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Role Key (e.g. mahasiswa)</label>
              <input
                type="text"
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Role Name (e.g. Mahasiswa)</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 outline-none"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-300">Set as default role for new users</label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Adding..." : "Save Role"}
            </button>
          </div>
        </form>
      )}

      {roles.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No roles defined yet. Register custom roles for access mappings.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {roles.map((role) => (
            <div key={role.id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-white">
                  {role.roleName}{" "}
                  {role.isDefault && (
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 ml-1.5">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{role.roleKey}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs text-slate-500 max-w-xs text-right truncate">
                  {role.description || "-"}
                </p>
                <button
                  onClick={() => handleDeleteRole(role.id, role.roleName)}
                  disabled={deletingId === role.id}
                  className="text-rose-500 hover:text-rose-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {deletingId === role.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
