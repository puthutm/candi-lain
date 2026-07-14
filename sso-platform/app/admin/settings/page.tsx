"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Form State
  const [portalName, setPortalName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionShortName, setInstitutionShortName] = useState("");
  const [sessionLifetime, setSessionLifetime] = useState(3600);
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [mfaPolicy, setMfaPolicy] = useState("optional");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.success && data.settings) {
        setPortalName(data.settings.portalName);
        setInstitutionName(data.settings.institutionName);
        setInstitutionShortName(data.settings.institutionShortName);
        setSessionLifetime(data.settings.sessionLifetime);
        setAllowSelfRegistration(data.settings.allowSelfRegistration);
        setMfaPolicy(data.settings.mfaPolicy);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal memuat konfigurasi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalName,
          institutionName,
          institutionShortName,
          sessionLifetime,
          allowSelfRegistration,
          mfaPolicy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Konfigurasi SSO berhasil diperbarui!");
      } else {
        triggerToast(data.error || "Gagal menyimpan konfigurasi", "error");
      }
    } catch (err) {
      triggerToast("Galat jaringan.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Pengaturan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      <AdminSidebar activeTab="settings" adminName="Administrator" />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Pengaturan Sistem SSO
            </h1>
            <p className="text-slate-400 text-sm mt-1">Konfigurasi branding, masa berlaku sesi, kebijakan MFA, dan registrasi mandiri.</p>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md space-y-6">
            <h2 className="text-lg font-bold text-indigo-400 pb-2 border-b border-white/5">1. Branding & Identitas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama Portal</label>
                <input
                  type="text"
                  required
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Contoh: SSO Portal"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama Institusi</label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Contoh: Universitas Siber Asia"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Singkatan Institusi</label>
                <input
                  type="text"
                  required
                  value={institutionShortName}
                  onChange={(e) => setInstitutionShortName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Contoh: UNSIA"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md space-y-6">
            <h2 className="text-lg font-bold text-indigo-400 pb-2 border-b border-white/5">2. Kebijakan Sesi & Keamanan</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Masa Berlaku Sesi (detik)</label>
                <input
                  type="number"
                  required
                  value={sessionLifetime}
                  onChange={(e) => setSessionLifetime(Number(e.target.value))}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Default: 3600 (1 Jam)"
                />
                <span className="text-[10px] text-slate-500 font-medium">Berapa lama token sesi user berlaku sebelum otomatis logout.</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Kebijakan MFA (Multi-Factor Auth)</label>
                <select
                  value={mfaPolicy}
                  onChange={(e) => setMfaPolicy(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="disabled">Dinonaktifkan (Disabled)</option>
                  <option value="optional">Opsional (Ditentukan Pengguna)</option>
                  <option value="enforced">Wajib untuk Semua (Enforced)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-white">Izinkan Registrasi Mandiri</h3>
                <p className="text-xs text-slate-400 mt-0.5">Memungkinkan pengguna umum mendaftar akun baru sendiri melalui halaman sign-in.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSelfRegistration}
                  onChange={(e) => setAllowSelfRegistration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold hover:opacity-90 transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>

        {/* TOAST MESSAGE */}
        {toastMsg && (
          <div className={`fixed bottom-6 right-6 bg-slate-900 border text-white font-semibold text-xs px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce ${
            toastType === "success" ? "border-emerald-500/30" : "border-rose-500/30"
          }`}>
            <span>{toastType === "success" ? "✨" : "❌"}</span> {toastMsg}
          </div>
        )}
      </main>
    </div>
  );
}
