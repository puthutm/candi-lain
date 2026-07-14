"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AppActionsProps {
  app: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    redirectUris: string[];
    status: string;
  };
}

export default function AppActions({ app }: AppActionsProps) {
  const router = useRouter();
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description || "");
  const [logoUrl, setLogoUrl] = useState(app.logoUrl || "");
  const [redirectUris, setRedirectUris] = useState(app.redirectUris.join("\n"));
  const [status, setStatus] = useState(app.status);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      triggerNotice("Application Name is required", true);
      return;
    }

    setSaving(true);
    triggerNotice("Saving changes...");
    try {
      const uris = redirectUris.split("\n").map(u => u.trim()).filter(u => u.length > 0);
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          logoUrl: logoUrl || null,
          redirectUris: uris,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotice("Application updated successfully!");
        setShowEdit(false);
        router.refresh();
      } else {
        triggerNotice(data.error || "Failed to update application", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete '${app.name}'? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    triggerNotice("Deleting application...");
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerNotice("Application deleted successfully!");
        setTimeout(() => {
          window.location.href = "/admin/applications";
        }, 1500);
      } else {
        const data = await res.json();
        triggerNotice(data.error || "Failed to delete application", true);
      }
    } catch (err: any) {
      triggerNotice("Network error: " + err.message, true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
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

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="rounded-lg bg-white/5 border border-white/10 hover:border-white/20 px-4 py-2 text-xs font-bold text-slate-200 transition"
        >
          {showEdit ? "✕ Close Form" : "✏️ Edit Application"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-rose-600/10 border border-rose-500/20 hover:border-rose-500/50 px-4 py-2 text-xs font-bold text-rose-400 transition disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "🗑️ Delete Application"}
        </button>
      </div>

      {/* Edit Form */}
      {showEdit && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md animate-fadeIn">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modify Application settings</h3>
          <p className="text-xs text-slate-400 mt-1">Configure name, whitelisted callback URLs, and status.</p>

          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400" htmlFor="name">
                Application Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400" htmlFor="logoUrl">
                Logo URL
              </label>
              <input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400" htmlFor="redirectUris">
                Redirect URIs (One URL per line)
              </label>
              <textarea
                id="redirectUris"
                rows={4}
                value={redirectUris}
                onChange={(e) => setRedirectUris(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
