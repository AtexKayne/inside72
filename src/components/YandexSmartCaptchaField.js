"use client";

import { SmartCaptcha } from "@yandex/smart-captcha";
import { YANDEX_SMARTCAPTCHA_CLIENT_KEY } from "@/lib/yandex-smartcaptcha";

export function YandexSmartCaptchaField({ resetKey, onToken, onTokenExpired }) {
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
