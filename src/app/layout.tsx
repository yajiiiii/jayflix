import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { MyListProvider } from "@/context/MyListContext";

export const metadata: Metadata = {
  title: "Jayflix",
  description: "A Netflix-inspired streaming app built with Next.js",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-netflix-black text-white min-h-screen"
      >
        <MyListProvider>
          <AppShell>{children}</AppShell>
        </MyListProvider>
      </body>
    </html>
  );
}
