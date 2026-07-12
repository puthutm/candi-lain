import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Keuangan Terpadu (SKEU) - UNSIA",
  description: "Portal Keuangan Mahasiswa & Biro Keuangan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
