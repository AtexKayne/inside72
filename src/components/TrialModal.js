"use client";

import { useCallback, useEffect } from "react";
import { useTrialModal } from "@/contexts/TrialModalContext";
import { TrialForm } from "@/components/TrialForm";
import { useModalTransition } from "@/hooks/useModalTransition";
import styles from "@/components/trial-modal.module.scss";

export function TrialModal() {
  const { open, closeModal } = useTrialModal();
  const { mounted, exiting, requestClose, handleAnimationEnd } = useModalTransition(open);

  const close = useCallback(() => {
    requestClose(closeModal);
  }, [requestClose, closeModal]);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || exiting) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, exiting, close]);

  if (!mounted) return null;

  return (
    <div
      className={`${styles.backdrop} ${exiting ? styles.backdropExiting : ""}`}
      role="presentation"
      onAnimationEnd={handleAnimationEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget && !exiting) close();
      }}
    >
      <div
        className={`${styles.dialog} ${exiting ? styles.dialogExiting : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h2 id="trial-modal-title" className={styles.title}>
          Пробное занятие
        </h2>
        <p className={styles.lead}>
          Оставьте заявку — мы ответим и подберём удобное время. Заявка на сайте уходит на почту студии.
        </p>
        <TrialForm idPrefix="trial-modal" />
      </div>
    </div>
  );
}


