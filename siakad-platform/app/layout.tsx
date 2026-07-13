import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { INSTITUTION_NAME, INSTITUTION_SHORT_NAME, APP_NAME } from "@/lib/client-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} ${INSTITUTION_SHORT_NAME} - Sistem Informasi Akademik Terpadu`,
  description: `Sistem Informasi Akademik Terpadu ${INSTITUTION_NAME}.`,
};

import { RoleProvider } from "./context/RoleContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
