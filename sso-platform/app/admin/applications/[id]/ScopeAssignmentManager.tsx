"use client";

import { useEffect, useState } from "react";

interface Scope {
  id: string;
  code: string;
  description: string | null;
}

interface ScopeAssignmentManagerProps {
  appId: string;
}

export default function ScopeAssignmentManager({ appId }: ScopeAssignmentManagerProps) {
  const [allScopes, setAllScopes] = useState<Scope[]>([]);
  const [assignedScopeIds, setAssignedScopeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      // Fetch all available scopes
      const scopesRes = await fetch("/api/admin/scopes");
      const scopesData = await scopesRes.json();
      if (scopesData.scopes) {
        setAllScopes(scopesData.scopes);
      }

      // Fetch assigned scopes for this application
      const appRes = await fetch(`/api/admin/applications/${appId}`);
      const appData = await appRes.json();
      if (appData.scopes) {
        setAssignedScopeIds(appData.scopes.map((s: Scope) => s.id));
      }
    } catch (err: any) {
      console.error("Failed to fetch scopes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appId]);

  const toggleScope = (scopeId: string) => {
    setAssignedScopeIds((prev) =>
      prev.includes(scopeId)
        ? prev.filter((id) => id !== scopeId)
        : [...prev, scopeId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/applications/${appId}/scopes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeIds: assignedScopeIds }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Scope assignments updated successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update scope assignments" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Error: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
        <h2 className="text-base font-bold">Scope Assignments</h2>
        <p className="mt-2 text-xs text-slate-400">Loading scopes...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
      <h2 className="text-base font-bold">Scope Assignments</h2>
      <p className="mt-1 text-xs text-slate-400">
        Assign OAuth scopes that this application is allowed to request.
      </p>

      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
        {allScopes.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No scopes available. Create scopes first in the Scopes management page.</p>
        ) : (
          allScopes.map((scope) => (
            <label
              key={scope.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 cursor-pointer hover:bg-slate-900/60 transition"
            >
              <input
                type="checkbox"
                checked={assignedScopeIds.includes(scope.id)}
                onChange={() => toggleScope(scope.id)}
                className="h-4 w-4 rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-mono font-semibold text-white">{scope.code}</span>
                {scope.description && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{scope.description}</p>
                )}
              </div>
            </label>
          ))
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Scope Assignments"}
      </button>

      {message && (
        <div
          className={`mt-3 rounded-lg p-3 text-xs ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
