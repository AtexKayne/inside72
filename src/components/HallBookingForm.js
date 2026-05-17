"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBookingSlot } from "@/lib/hall-calendar";
import { PersonalDataConsent } from "@/components/PersonalDataConsent";
import { YandexSmartCaptchaField } from "@/components/YandexSmartCaptchaField";
import pages from "@/styles/pages.module.scss";
import styles from "./hall-rental-calendar.module.scss";

export function HallBookingForm({ hallId, hallLabel, slotStart, slotEnd, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  }, []);

  const canSubmit = consent && Boolean(captchaToken) && !loading;
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

    if (!captchaToken) {
      setError("Подтвердите, что вы не робот");
      return;
    }

    if (!consent) {
      setError("Необходимо согласие на обработку персональных данных");
      return;
    }

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
          hallId,
          slotStart: slotStart.toISOString(),
          slotEnd: slotEnd.toISOString(),
          smartToken: captchaToken,
          personalDataConsent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка отправки");
        resetCaptcha();
        return;
      }
      setOk(true);
      setName("");
      setPhone("");
      setEmail("");
      setComment("");
      setConsent(false);
      resetCaptcha();
    } catch {
      setError("Сеть недоступна. Попробуйте позже.");
      resetCaptcha();
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
          Заявка на аренду — {hallLabel}
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
            <YandexSmartCaptchaField
              resetKey={captchaResetKey}
              onToken={setCaptchaToken}
              onTokenExpired={() => setCaptchaToken("")}
            />
            {error ? <p className={pages.formError}>{error}</p> : null}
            <PersonalDataConsent
              id="hall-booking-consent"
              checked={consent}
              onChange={setConsent}
              className={styles.modalConsent}
            />
            <button className={pages.btn} type="submit" disabled={!canSubmit}>
              {loading ? "Отправка…" : "Отправить заявку"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
