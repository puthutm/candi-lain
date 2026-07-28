"use client";

import { Suspense } from "react";
import SsoHeader from "../components/SsoHeader";
import SsoBanner from "../components/SsoBanner";
import SsoLoginForm from "../components/SsoLoginForm";
import SsoFooter from "../components/SsoFooter";

function LoginContent() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans flex flex-col justify-between">
      {/* Top Header Component */}
      <SsoHeader />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column Intro Banner Component */}
        <SsoBanner />

        {/* Right Column Login Form Component */}
        <SsoLoginForm />
      </main>

      {/* Universal Footer Component */}
      <SsoFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans text-xs font-bold">
          Memuat Halaman SSO Login...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
