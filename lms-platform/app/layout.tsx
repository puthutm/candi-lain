import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { RoleProvider } from "./context/RoleContext";
import "./globals.css";
import { INSTITUTION_NAME, INSTITUTION_SHORT_NAME, APP_NAME } from "@/lib/client-config";

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} ICEMS — ${INSTITUTION_NAME}`,
  description: `Learning Management System ${INSTITUTION_SHORT_NAME}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${sansFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-800 font-sans">
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
