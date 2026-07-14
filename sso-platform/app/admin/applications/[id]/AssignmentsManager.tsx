"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  grantedAt: string;
}

interface Role {
  id: string;
  roleName: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AssignmentsManagerProps {
  appId: string;
  initialAssignments: Assignment[];
  roles: Role[];
}

export default function AssignmentsManager({ appId, initialAssignments, roles }: AssignmentsManagerProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (showAddForm) {
      fetchUsers();
    }
  }, [showAddForm]);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/assignments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.users || []);
        if (data.users?.length > 0) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch {
      triggerNotice("Failed to load users list", true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleId = selectedRoleId || (roles[0]?.id || "");
    if (!selectedUserId || !roleId) {
      triggerNotice("User and Role are required", true);
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, roleId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice(data.message || "User assigned successfully!");
        setShowAddForm(false);
        // Reload all data
        window.location.reload();
      } else {
        triggerNotice(data.error || "Failed to assign role", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = async (assignmentId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke role access for '${name}'?`)) {
      return;
    }

    setRevokingId(assignmentId);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/assignments?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotice("Assignment revoked successfully!");
        setAssignments(assignments.filter(a => a.id !== assignmentId));
        router.refresh();
      } else {
        triggerNotice(data.error || "Failed to revoke assignment", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setRevokingId(null);
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
          <h2 className="text-base font-bold">User Assignments</h2>
          <p className="text-xs text-slate-400 mt-0.5">Users mapped with roles who have access permission.</p>
        </div>
        {roles.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
          >
            {showAddForm ? "Cancel" : "+ Assign User"}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAssign} className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Select User</label>
              {loadingUsers ? (
                <div className="text-xs text-slate-400 py-2">Loading active users...</div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Assign Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
              >
                <option value="">-- Choose Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={assigning || loadingUsers}
              className="rounded bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
            >
              {assigning ? "Assigning..." : "Assign Role"}
            </button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No user role assignments active for this application.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {assignments.map((asg) => (
            <div key={asg.id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-white">{asg.fullName}</p>
                <p className="text-xs text-slate-400">{asg.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                    {asg.roleName}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Assigned {new Date(asg.grantedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(asg.id, asg.fullName)}
                  disabled={revokingId === asg.id}
                  className="text-rose-500 hover:text-rose-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {revokingId === asg.id ? "..." : "Revoke"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
