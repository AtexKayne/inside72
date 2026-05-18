"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const TrialModalContext = createContext(null);

export function TrialModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#trial") return;

    setOpen(true);
    const url = pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, [pathname]);

  const value = useMemo(
    () => ({ open, openModal, closeModal }),
    [open, openModal, closeModal],
  );

  return <TrialModalContext.Provider value={value}>{children}</TrialModalContext.Provider>;
}

export function useTrialModal() {
  const ctx = useContext(TrialModalContext);
  if (!ctx) {
    throw new Error("useTrialModal must be used within TrialModalProvider");
  }
  return ctx;
}
