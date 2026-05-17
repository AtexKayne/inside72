"use client";

import { useEffect, useState } from "react";
import { formatBookingSlot } from "@/lib/hall-calendar";
import pages from "@/styles/pages.module.scss";
import styles from "./hall-rental-calendar.module.scss";

export function HallBookingForm({ slotStart, slotEnd, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const slotLabel = formatBookingSlot(slotStart, slotEnd);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch("/api/hall-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          comment,
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка отправки");
        return;
      }
      setOk(true);
      setName("");
      setPhone("");
      setEmail("");
      setComment("");
    } catch {
      setError("Сеть недоступна. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hall-booking-title"
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          disabled={loading}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h3 id="hall-booking-title" className={styles.modalTitle}>
          Заявка на аренду зала
        </h3>
        <p className={styles.modalSlot}>{slotLabel}</p>

        {ok ? (
          <p className={pages.formOk}>
            Заявка отправлена. Администратор подтвердит запись и свяжется с вами.
          </p>
        ) : (
          <form className={pages.form} onSubmit={onSubmit}>
            <div className={pages.field}>
              <label htmlFor="hall-name">Имя</label>
              <input
                id="hall-name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={pages.field}>
              <label htmlFor="hall-phone">Телефон</label>
              <input
                id="hall-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="+7 …"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className={pages.field}>
              <label htmlFor="hall-email">Email (необязательно)</label>
              <input
                id="hall-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={pages.field}>
              <label htmlFor="hall-comment">Комментарий</label>
              <textarea
                id="hall-comment"
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            {error ? <p className={pages.formError}>{error}</p> : null}
            <button className={pages.btn} type="submit" disabled={loading}>
              {loading ? "Отправка…" : "Отправить заявку"}
            </button>
            <p className={styles.modalConsent}>
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных для связи по заявке.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
