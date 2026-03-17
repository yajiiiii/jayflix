"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/watch/");

  return (
    <>
      {!hideChrome ? <Navbar /> : null}
      <main className="min-h-screen">{children}</main>
      {!hideChrome ? <Footer /> : null}
    </>
  );
}
