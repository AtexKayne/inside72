"use client";

import { useCallback, useEffect, useState } from "react";
import { useModalTransition } from "@/hooks/useModalTransition";
import { formatBookingSlot } from "@/lib/hall-calendar";
import { PhoneInput } from "@/components/PhoneInput";
import { PersonalDataConsent } from "@/components/PersonalDataConsent";
import { YandexSmartCaptchaField } from "@/components/YandexSmartCaptchaField";
import { FormContactTabs } from "@/components/FormContactTabs";
import { ContactAlexanderPanel } from "@/components/ContactAlexanderPanel";
import { useCaptchaRequired } from "@/hooks/useCaptchaRequired";
import { isRuPhoneComplete } from "@/lib/phone-mask";
import pages from "@/styles/pages.module.scss";
import styles from "./hall-rental-calendar.module.scss";

export function HallBookingForm({ hallId, hallLabel, slotStart, slotEnd, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const captchaRequired = useCaptchaRequired();

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  }, []);

  const captchaSatisfied = captchaRequired === false || Boolean(captchaToken);
  const canSubmit = consent && captchaSatisfied && !loading && captchaRequired !== null;
  const slotLabel = formatBookingSlot(slotStart, slotEnd);
  const { mounted, exiting, requestClose, handleAnimationEnd } = useModalTransition(true);

  const close = useCallback(() => {
    if (loading || exiting) return;
    requestClose(onClose);
  }, [loading, exiting, requestClose, onClose]);

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
    function onKeyDown(e) {
      if (e.key === "Escape" && !loading) close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, exiting, loading, close]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!isRuPhoneComplete(phone)) {
      setError("Укажите полный номер телефона");
      return;
    }

    if (captchaRequired && !captchaToken) {
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

  if (!mounted) return null;

  return (
    <div
      className={`${styles.modalBackdrop} ${exiting ? styles.modalBackdropExiting : ""}`}
      role="presentation"
      onAnimationEnd={handleAnimationEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !exiting) close();
      }}
    >
      <div
        className={`${styles.modal} ${exiting ? styles.modalExiting : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hall-booking-title"
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={close}
          disabled={loading}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h2 id="hall-booking-title" className={styles.modalTitle}>
          Заявка на аренду — {hallLabel}
        </h2>
        <p className={styles.modalSlot}>{slotLabel}</p>

        <FormContactTabs
          idPrefix="hall-booking"
          application={
            ok ? (
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
                  <PhoneInput id="hall-phone" value={phone} onChange={setPhone} required />
                </div>
                <div className={pages.field}>
                  <label htmlFor="hall-comment">Комментарий</label>
                  <textarea
                    id="hall-comment"
                    name="comment"
                    value={comment}
                    placeholder="Например: удобнее связаться в Telegram или VK, или ссылка на другую соцсеть"
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                {captchaRequired ? (
                  <YandexSmartCaptchaField
                    resetKey={captchaResetKey}
                    onToken={setCaptchaToken}
                    onTokenExpired={() => setCaptchaToken("")}
                  />
                ) : null}
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
            )
          }
          direct={
            <ContactAlexanderPanel
              idPrefix="hall-alexander"
              intent="hall-booking"
              name={name}
              phone={phone}
              comment={comment}
              hallLabel={hallLabel}
              slotLabel={slotLabel}
            />
          }
        />
      </div>
    </div>
  );
}
