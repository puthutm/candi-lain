import type { Metadata } from "next";
import { RoleProvider } from "./context/RoleContext";
import "./globals.css";
import { INSTITUTION_NAME, APP_NAME } from "@/lib/client-config";
import { bootstrapDatabase } from "@/db";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${INSTITUTION_NAME}`,
  description: `Repositori terpusat Bank Materi & Bank Soal ${INSTITUTION_NAME}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auto-run database and application bootstrap check on load
  await bootstrapDatabase();

  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
