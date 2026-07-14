"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

interface AdminProfileClientProps {
  user: {
    fullName: string;
    email: string;
  };
}

export default function AdminProfileClient({ user }: AdminProfileClientProps) {
  const router = useRouter();
  
  // Profile update state
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Toast notification
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Profil admin berhasil diperbarui!");
        router.refresh();
      } else {
        triggerToast(data.error || "Gagal memperbarui profil", "error");
      }
    } catch (err) {
      triggerToast("Galat jaringan.", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast("Konfirmasi password baru tidak cocok!", "error");
      return;
    }
    if (newPassword.length < 8) {
      triggerToast("Password baru minimal 8 karakter!", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Password berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        triggerToast(data.error || "Gagal mengubah password", "error");
      }
    } catch (err) {
      triggerToast("Galat jaringan.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      <AdminSidebar activeTab="profile" adminName={fullName} />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Profil Administrator
            </h1>
            <p className="text-slate-400 text-sm mt-1">Ubah data profil pribadi dan ganti kata sandi keamanan Anda.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PROFILE FORM */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md flex flex-col gap-5 h-fit">
            <div>
              <h2 className="text-lg font-bold text-indigo-400 pb-2 border-b border-white/5">Informasi Profil</h2>
              <p className="text-xs text-slate-400 mt-1">Ubah nama lengkap dan alamat email aktif Anda.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="email@domain.com"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full mt-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {updatingProfile ? "Memperbarui..." : "Perbarui Profil"}
              </button>
            </form>
          </section>

          {/* PASSWORD FORM */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md flex flex-col gap-5 h-fit">
            <div>
              <h2 className="text-lg font-bold text-indigo-400 pb-2 border-b border-white/5">Ganti Password</h2>
              <p className="text-xs text-slate-400 mt-1">Ganti kata sandi demi menjaga keamanan akun administrator Anda.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password Saat Ini</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Minimal 8 karakter"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                  placeholder="Ulangi password baru"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full mt-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {changingPassword ? "Mengubah..." : "Ubah Password"}
              </button>
            </form>
          </section>
        </div>

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
