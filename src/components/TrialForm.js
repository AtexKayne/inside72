"use client";

import { useCallback, useState } from "react";
import pages from "@/styles/pages.module.scss";
import { PhoneInput } from "@/components/PhoneInput";
import { PersonalDataConsent } from "@/components/PersonalDataConsent";
import { YandexSmartCaptchaField } from "@/components/YandexSmartCaptchaField";
import { useCaptchaRequired } from "@/hooks/useCaptchaRequired";
import { isRuPhoneComplete } from "@/lib/phone-mask";

export function TrialForm() {
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
  const captchaRequired = useCaptchaRequired();

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaResetKey((key) => key + 1);
  }, []);

  const captchaSatisfied = captchaRequired === false || Boolean(captchaToken);
  const canSubmit = consent && captchaSatisfied && !loading && captchaRequired !== null;

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
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          comment,
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
    <form id="trial" className={pages.form} onSubmit={onSubmit}>
      <div className={pages.field}>
        <label htmlFor="trial-name">Имя</label>
        <input
          id="trial-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className={pages.field}>
        <label htmlFor="trial-phone">Телефон</label>
        <PhoneInput id="trial-phone" value={phone} onChange={setPhone} required />
      </div>
      <div className={pages.field}>
        <label htmlFor="trial-email">Email (необязательно)</label>
        <input
          id="trial-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className={pages.field}>
        <label htmlFor="trial-comment">Комментарий</label>
        <textarea
          id="trial-comment"
          name="comment"
          value={comment}
          placeholder="Например: удобнее связаться в Telegram или WhatsApp, ссылка на ВК или другую соцсеть"
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
      {ok ? <p className={pages.formOk}>Заявка отправлена. Мы свяжемся с вами.</p> : null}
      <PersonalDataConsent id="trial-consent" checked={consent} onChange={setConsent} />
      <button className={pages.btn} type="submit" disabled={!canSubmit}>
        {loading ? "Отправка…" : "Отправить заявку"}
      </button>
    </form>
  );
}
