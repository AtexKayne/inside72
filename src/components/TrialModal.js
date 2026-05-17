"use client";

import { useTrialModal } from "@/contexts/TrialModalContext";
import { TrialForm } from "@/components/TrialForm";
import styles from "@/components/trial-modal.module.scss";

export function TrialModal() {
  const { open, closeModal } = useTrialModal();

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={closeModal}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h2 id="trial-modal-title" className={styles.title}>
          Пробное занятие
        </h2>
        <p className={styles.lead}>
          Оставьте заявку — мы ответим и подберём удобное время. Заявка уходит на почту студии.
        </p>
        <TrialForm idPrefix="trial-modal" />
      </div>
    </div>
  );
}
