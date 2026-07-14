"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialUser: {
    fullName: string;
    email: string;
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [email, setEmail] = useState(initialUser.email);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      triggerNotice("Nama lengkap dan email wajib diisi", true);
      return;
    }

    setLoading(true);
    setNotice("Menyimpan profil...");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Profil berhasil diperbarui!");
        router.refresh();
      } else {
        triggerNotice(data.error || "Gagal memperbarui profil", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotice = (msg: string, error = false) => {
    setNotice(msg);
    setIsError(error);
    setTimeout(() => {
      setNotice(null);
    }, 5000);
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerNotice("Semua field password wajib diisi", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerNotice("Konfirmasi password baru tidak cocok", true);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotice(data.message || "Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        triggerNotice(data.error || "Gagal mengubah password", true);
      }
    } catch (err: any) {
      triggerNotice("Kesalahan jaringan: " + err.message, true);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-sm text-slate-400">Nama Saat Ini</div>
          <div className="mt-1 text-lg font-semibold">{initialUser.fullName}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-sm text-slate-400">Email Saat Ini</div>
          <div className="mt-1 text-lg font-semibold">{initialUser.email}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <p className="mt-1 text-sm text-slate-400">Perbarui detail profil akun SSO Anda</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="fullName"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  loading
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/25 cursor-pointer"
                }`}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Ganti Password</h2>
          <p className="mt-1 text-sm text-slate-400">Jaga keamanan akun Anda dengan memperbarui password secara berkala</p>

          <form onSubmit={handlePasswordChangeSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="currentPassword"
              >
                Password Lama
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="newPassword"
              >
                Password Baru
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="confirmPassword"
              >
                Konfirmasi Password Baru
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  passwordLoading
                    ? "bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/25 cursor-pointer"
                }`}
              >
                {passwordLoading ? "Memproses..." : "Ganti Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
