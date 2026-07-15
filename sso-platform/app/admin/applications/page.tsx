"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminAppsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields matching mockup
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [appLink, setAppLink] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Registered credentials modal
  const [credentials, setCredentials] = useState<{ clientId: string; clientSecret: string } | null>(null);

  const rolesOptions = ["Super User", "Admin", "Dosen", "Mahasiswa", "Pegawai"];
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (data.success) {
        setApps(data.clients || []);
      } else {
        setError(data.error || "Gagal memuat aplikasi");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRoleSelection = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !redirectUri) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          description: description || appLink ? `Link: ${appLink}. ${description}` : "",
          redirectUris: [redirectUri],
          logoUrl: logoPreview || "",
          roles: selectedRoles,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCredentials({
          clientId: data.clientId,
          clientSecret: data.clientSecret,
        });
        // Reset form
        setAppName("");
        setDescription("");
        setAppLink("");
        setRedirectUri("");
        setSelectedRoles([]);
        setLogoPreview(null);
        setIsModalOpen(false);
        fetchApps();
      } else {
        alert(data.error || "Gagal mendaftarkan aplikasi");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white relative">
      <AdminSidebar activeTab="applications" adminName="Administrator" />

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications Registry</h1>
            <p className="text-slate-400 text-sm mt-1">Manage client OAuth2 integrations and redirection endpoints.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            + Register Application
          </button>
        </header>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat data...</div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 font-semibold">{error}</div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {apps.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No applications registered yet. Click "+ Register Application" to start.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4">App Name</th>
                    <th className="p-4">Client ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Redirect URIs</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-semibold text-white flex items-center gap-3">
                        {app.logoUrl ? (
                          <img src={app.logoUrl} className="w-7 h-7 rounded-full object-cover" alt="Logo" />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                            📱
                          </span>
                        )}
                        {app.name}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">{app.clientId}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            app.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {app.redirectUris?.length} whitelisted URIs
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="text-xs font-semibold text-indigo-400 hover:underline"
                        >
                          Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* CREDENTIALS SUCCESS DISPLAY MODAL */}
      {credentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Aplikasi Berhasil Didaftarkan!
            </h3>
            <p className="text-xs text-slate-400">
              Salin informasi keamanan di bawah ini. Demi keamanan, **Client Secret** hanya akan ditampilkan sekali ini saja.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client ID</span>
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-xs select-all text-slate-300">
                  {credentials.clientId}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Secret</span>
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-3 font-mono text-xs select-all text-emerald-300">
                  {credentials.clientSecret}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCredentials(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {/* ADD APPLICATION MODAL DIALOG (MATCHING THE SCREENSHOT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-6">Tambah Aplikasi</h2>

            <form onSubmit={handleRegisterApp} className="space-y-5">
              {/* Circular Avatar Uploader */}
              <div className="flex flex-col items-center justify-center pb-2">
                <label className="relative cursor-pointer group">
                  <div className="w-28 h-28 rounded-full border-4 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-100">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-full h-full object-cover" alt="App Logo" />
                    ) : (
                      <svg className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-slate-200 text-slate-700 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow transition-all group-hover:bg-slate-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Nama Aplikasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nama Aplikasi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 font-bold text-lg select-none">≡</span>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="SIPPM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Deskripsi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-start">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold text-lg select-none">#</span>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Aplikasi BKD"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              {/* Link Aplikasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Link Aplikasi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 font-bold text-sm select-none">🔗</span>
                  <input
                    type="url"
                    required
                    value={appLink}
                    onChange={(e) => setAppLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Roles (Select Dropdown) */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-700 block">
                  Roles <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => setIsRolesDropdownOpen(!isRolesDropdownOpen)}
                  className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 outline-none cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <span className="absolute left-4 text-slate-400 font-bold text-sm">👤</span>
                  <span className={selectedRoles.length === 0 ? "text-slate-400" : "font-semibold"}>
                    {selectedRoles.length === 0 ? "Select Roles" : selectedRoles.join(", ")}
                  </span>
                  <span className="absolute right-4 text-slate-400 font-bold text-xs select-none">
                    {isRolesDropdownOpen ? "▲" : "▼"}
                  </span>
                </div>

                {isRolesDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                    {rolesOptions.map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <div
                          key={role}
                          onClick={() => toggleRoleSelection(role)}
                          className="px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold cursor-pointer text-slate-700"
                        >
                          <span>{role}</span>
                          {isSelected && <span className="text-indigo-600 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Redirect URI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Redirect URI <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 font-bold text-sm select-none">🔗</span>
                  <input
                    type="url"
                    required
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                    placeholder="https://example.com/callback"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Daftarkan Aplikasi..." : "Daftarkan Aplikasi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
