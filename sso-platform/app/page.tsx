"use client";

import { Suspense, useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions";
import { PORTAL_NAME } from "@/lib/client-config";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("return_to");
  const returnTo = returnToRaw && returnToRaw.startsWith("/") ? returnToRaw : "/home";

  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    const legacyState = state as { success?: boolean; redirectTo?: string } | null;
    const nextState = state as { status?: "success" | "error" | "idle"; redirectTo?: string } | null;

    const redirectTo = nextState?.redirectTo || legacyState?.redirectTo;
    const isSuccess = Boolean(nextState?.status === "success" || legacyState?.success);

    if (!isSuccess || !redirectTo) return;

    if (redirectTo.startsWith("http://") || redirectTo.startsWith("https://")) {
      window.location.href = redirectTo;
    } else {
      router.push(redirectTo);
    }
  }, [state, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic glow blobs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* Glassmorphism Card */}
      <div className="z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <h2 className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {PORTAL_NAME}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your corporate applications
          </p>
        </div>

        <form action={formAction} method="post" className="space-y-6">
          <input type="hidden" name="return_to" value={returnTo} />

          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="username">
              Username or Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-white/[0.08]"
              placeholder="e.g. johndoe"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-white/[0.08]"
              placeholder="••••••••"
            />
          </div>

          {/* Error Message */}
          {(() => {
            const legacyState = state as { error?: string } | null;
            const nextState = state as { status?: "error" | "success" | "idle"; message?: string } | null;
            const errorMessage = legacyState?.error || (nextState?.status === "error" ? nextState.message : undefined);

            if (!errorMessage) return null;

            return (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-medium text-red-400">
                {errorMessage}
              </div>
            );
          })()}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
