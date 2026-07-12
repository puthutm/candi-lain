"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAppAction } from "./actions";

export default function RegisterAppPage() {
  const [state, formAction, isPending] = useActionState(registerAppAction, null);

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            SSO Admin
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/admin"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/applications"
              className="rounded-lg bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-400"
            >
              Applications
            </Link>
            <Link
              href="/admin/reference"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Reference Data
            </Link>
            <Link
              href="/home"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              &larr; User Portal
            </Link>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto max-w-2xl mx-auto w-full">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register Application</h1>
            <p className="text-slate-400 text-sm mt-1">Register a new client integration in the SSO ecosystem.</p>
          </div>
          <Link
            href="/admin/applications"
            className="text-sm font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </Link>
        </header>

        {state?.success ? (
          /* Credentials success card */
          <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-lg font-bold">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Application Registered Successfully!</h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Please copy the credentials below. For security reasons, the **Client Secret** is stored as a hash and **will not be shown again**.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Name</span>
                <p className="text-sm font-semibold text-white">{state.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client ID</span>
                <div className="rounded bg-slate-900 p-3 font-mono text-xs select-all border border-white/5 text-slate-300">
                  {state.clientId}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client Secret</span>
                <div className="rounded bg-slate-900 p-3 font-mono text-xs select-all border border-emerald-500/30 text-emerald-300">
                  {state.clientSecret}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Redirection Whitelist</span>
                <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                  {state.redirectUris.map((uri: string) => (
                    <li key={uri}>{uri}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/admin/applications"
                className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold hover:bg-emerald-500 transition-all shadow-md"
              >
                Go to Registry
              </Link>
            </div>
          </div>
        ) : (
          /* Register Form */
          <form action={formAction} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="name">
                Application Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. HRIS System"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief summary of application purpose..."
                className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="logoUrl">
                Logo URL (Optional)
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="redirectUris">
                  Redirect URIs (Whitelisted Callback URLs)
                </label>
              </div>
              <textarea
                id="redirectUris"
                name="redirectUris"
                required
                placeholder="http://localhost:8080/callback&#10;https://hris.company.com/sso/callback"
                className="w-full h-24 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 resize-none font-mono text-xs leading-5"
              />
              <p className="text-[10px] text-slate-500">Enter one URL per line. Only HTTPS is whitelisted in production (HTTP whitelisted for localhost/127.0.0.1 development only).</p>
            </div>

            {state?.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-medium text-red-400">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Registering..." : "Register Application"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
