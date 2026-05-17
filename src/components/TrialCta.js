"use client";

import { useTrialModal } from "@/contexts/TrialModalContext";

export function TrialCta({ className, children }) {
  const { openModal } = useTrialModal();

  return (
    <button type="button" className={className} onClick={openModal}>
      {children}
    </button>
  );
}
