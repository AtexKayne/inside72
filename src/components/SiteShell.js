"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PageTransition } from "@/components/PageTransition";

export function SiteShell({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <PageTransition />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
