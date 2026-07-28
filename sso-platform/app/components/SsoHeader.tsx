"use client";

export default function SsoHeader() {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-8 py-3.5 shadow-sm z-20 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Logo UNSIA */}
        <div className="flex items-center gap-2.5">
          <svg className="h-10 w-[240px]" viewBox="0 0 240 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 2)">
              <path d="M22 0 C10 0 3 7 3 16 C3 28 22 40 22 40 C22 40 41 28 41 16 C41 7 34 0 22 0 Z" fill="#0B4A75" />
              <path d="M10 12 C14 8 18 8 22 12 C26 8 30 8 34 12 C30 16 26 16 22 12 C18 16 14 16 10 12 Z" fill="#FED524" />
              <path d="M10 19 C14 15 18 15 22 19 C26 15 30 15 34 19 C30 23 26 23 22 19 C18 23 14 23 10 19 Z" fill="#FED524" />
              <path d="M14 26 C17 23 20 23 22 26 C24 23 27 23 29 26 C27 29 24 29 22 26 C20 29 17 29 14 26 Z" fill="#FED524" />
            </g>
            <text x="52" y="20" fill="#0B4A75" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.3">Universitas</text>
            <text x="52" y="37" fill="#0B4A75" fontSize="17" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.3">Siber Asia</text>
          </svg>
        </div>
      </div>
    </header>
  );
}
