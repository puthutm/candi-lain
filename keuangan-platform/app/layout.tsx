import type { Metadata } from "next";
import "./globals.css";
import { INSTITUTION_SHORT_NAME, APP_NAME } from "@/lib/client-config";

export const metadata: Metadata = {
  title: `Sistem Keuangan Terpadu (${APP_NAME}) - ${INSTITUTION_SHORT_NAME}`,
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
