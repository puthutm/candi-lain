import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?return_to=%2Fhome%2Fsettings");
  }

  const isAdmin = isSuperAdmin(user);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isAdmin
            ? "Kelola pengaturan SSO, role, aplikasi, dan preferensi sistem."
            : "Kelola preferensi dan pengaturan akun Anda."}
        </p>

        <div className="mt-8 space-y-8">
          {/* Account Settings Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-slate-200">Account Settings</h2>
            
            {/* Password Section */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
              <h3 className="text-lg font-semibold">Password & Security</h3>
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
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
              <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
              <p className="mt-1 text-sm text-slate-400">
                Tambahkan lapisan keamanan ekstra untuk akun Anda.
              </p>
              <button
                className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
                disabled
              >
                Enable 2FA
              </button>
              <p className="mt-2 text-xs text-slate-500">(Coming soon)</p>
            </div>

            {/* Session Management Section */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
              <h3 className="text-lg font-semibold">Active Sessions</h3>
              <p className="mt-1 text-sm text-slate-400">
                Kelola perangkat dan sesi aktif Anda.
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Anda saat ini terhubung dari 1 perangkat.
              </p>
            </div>

            {/* Notification Preferences Section */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <p className="mt-1 text-sm text-slate-400">
                Kelola preferensi notifikasi Anda.
              </p>
              <button
                className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
                disabled
              >
                Manage Notifications
              </button>
              <p className="mt-2 text-xs text-slate-500">(Coming soon)</p>
            </div>
          </div>

          {/* Admin Settings Section */}
          {isAdmin && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-200">Administration</h2>
              
              {/* User Management Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">User Management</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Kelola pengguna, assign role, dan kontrol akses.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/users"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  Manage Users →
                </a>
              </div>

              {/* Role Management Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Role Management</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Buat dan kelola role untuk kontrol akses berbasis peran.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/roles"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  Add / Manage Roles →
                </a>
              </div>

              {/* Application Management Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Application Management</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Daftarkan aplikasi OAuth2, atur redirect URI, dan kelola credentials.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/applications"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  Add / Manage Apps →
                </a>
              </div>

              {/* Permission Management Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Permission Management</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Definisikan permission dan kaitkan dengan role.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/permissions"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  Manage Permissions →
                </a>
              </div>

              {/* OAuth Clients Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">OAuth2 Clients</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Kelola client credentials dan configure grant types.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/clients"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  Manage Clients →
                </a>
              </div>

              {/* System Configuration Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">System Configuration</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Atur token expiry, password policy, session timeout, dan konfigurasi global lainnya.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/settings"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  System Settings →
                </a>
              </div>

              {/* Audit Logs Section */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Audit Logs</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Lihat history semua aktivitas sistem untuk compliance dan debugging.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/audit-logs"
                  className="mt-4 inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20"
                >
                  View Audit Logs →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
