import { getSessionUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?return_to=%2Fhome%2Fsettings");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Kelola preferensi dan pengaturan akun Anda.
        </p>

        <div className="mt-8 space-y-8">
          {/* Password Section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold">Password & Security</h2>
            <p className="mt-1 text-sm text-slate-400">
              Ubah password akun Anda untuk keamanan maksimal.
            </p>
            <a
              href="/auth/change-password"
              className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Change Password
            </a>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="mt-1 text-sm text-slate-400">
              Tambahkan lapisan keamanan ekstra untuk akun Anda.
            </p>
            <button
              className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
              disabled
            >
              Enable 2FA
            </button>
            <p className="mt-2 text-xs text-slate-500">(Coming soon)</p>
          </div>

          {/* Session Management Section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <p className="mt-1 text-sm text-slate-400">
              Kelola perangkat dan sesi aktif Anda.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Anda saat ini terhubung dari 1 perangkat.
            </p>
          </div>

          {/* Notification Preferences Section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="mt-1 text-sm text-slate-400">
              Kelola preferensi notifikasi Anda.
            </p>
            <button
              className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
              disabled
            >
              Manage Notifications
            </button>
            <p className="mt-2 text-xs text-slate-500">(Coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
