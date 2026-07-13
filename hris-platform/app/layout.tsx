import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, INSTITUTION_SHORT_NAME } from "@/lib/client-config";

export const metadata: Metadata = {
  title: `${APP_NAME} ${INSTITUTION_SHORT_NAME}`,
  description: "Human Resources Information System",
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
