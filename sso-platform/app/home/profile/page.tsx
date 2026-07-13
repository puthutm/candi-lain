import { getSessionUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?return_to=%2Fhome%2Fprofile");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Kelola data profil Anda. (UI masih placeholder—belum ada update ke database)
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-sm text-slate-400">Nama</div>
            <div className="mt-1 text-lg font-semibold">{user.fullName}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-sm text-slate-400">Email</div>
            <div className="mt-1 text-lg font-semibold">{user.email}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <p className="mt-1 text-sm text-slate-400">Belum dihubungkan ke API/DB update.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                defaultValue={user.fullName}
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
                defaultValue={user.email}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled
                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-slate-500 border border-white/10 cursor-not-allowed"
              >
                Save (placeholder)
              </button>
              <span className="text-xs text-slate-500">
                Nanti dihubungkan ke server action/endpoint.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
