"use client";

import React, { useState, useRef, useEffect } from "react";

export interface AppItem {
  name: string;
  url: string;
  icon: string;
  color: string;
}

const APPS: AppItem[] = [
  { name: "SIAKAD", url: process.env.NEXT_PUBLIC_SIAKAD_URL || "http://10.10.20.56:3003", icon: "🎓", color: "bg-blue-600" },
  { name: "LMS", url: process.env.NEXT_PUBLIC_LMS_URL || "http://10.10.20.56:3004", icon: "📚", color: "bg-indigo-600" },
  { name: "PMB", url: process.env.NEXT_PUBLIC_PMB_URL || "http://10.10.20.56:3002", icon: "📝", color: "bg-emerald-600" },
  { name: "Keuangan", url: process.env.NEXT_PUBLIC_KEUANGAN_URL || "http://10.10.20.56:3005", icon: "💳", color: "bg-amber-600" },
  { name: "HRIS SDM", url: process.env.NEXT_PUBLIC_HRIS_URL || "http://10.10.20.56:3006", icon: "👥", color: "bg-purple-600" },
  { name: "Bank Konten", url: process.env.NEXT_PUBLIC_BANK_KONTEN_URL || "http://10.10.20.56:3007", icon: "📁", color: "bg-rose-600" },
];

export default function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="App Switcher (Pindah Aplikasi)"
        className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <circle cx="5" cy="5" r="2" />
          <circle cx="12" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2 uppercase tracking-wider">
            Platform Kampus
          </div>
          <div className="grid grid-cols-3 gap-2">
            {APPS.map((app) => (
              <a
                key={app.name}
                href={app.url}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center group"
              >
                <div className={`w-10 h-10 rounded-lg ${app.color} text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform`}>
                  {app.icon}
                </div>
                <span className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                  {app.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
