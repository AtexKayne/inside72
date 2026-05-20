"use client";

import { SmartCaptcha } from "@yandex/smart-captcha";
import { isCaptchaClientKeyConfigured, YANDEX_SMARTCAPTCHA_CLIENT_KEY } from "@/lib/yandex-smartcaptcha";

export function YandexSmartCaptchaField({ resetKey, onToken, onTokenExpired }) {
  if (!isCaptchaClientKeyConfigured()) return null;

  return (
    <SmartCaptcha
      key={resetKey}
      sitekey={YANDEX_SMARTCAPTCHA_CLIENT_KEY}
      language="ru"
      onSuccess={onToken}
      onTokenExpired={onTokenExpired}
    />
  );
}
