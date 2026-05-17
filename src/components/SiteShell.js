"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrialModal } from "@/components/TrialModal";
import { TrialModalProvider } from "@/contexts/TrialModalContext";

export function SiteShell({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return children;
  }

  return (
    <TrialModalProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <TrialModal />
    </TrialModalProvider>
  );
}
