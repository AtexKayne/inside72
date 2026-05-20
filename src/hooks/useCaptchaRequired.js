"use client";

import { useEffect, useState } from "react";
import { isCaptchaClientKeyConfigured, isCaptchaSkippedInBrowser } from "@/lib/yandex-smartcaptcha";

/** null — ещё не определено (гидрация); true — captcha нужна; false — localhost или ключ не задан */
export function useCaptchaRequired() {
  const [required, setRequired] = useState(null);

  useEffect(() => {
    setRequired(!isCaptchaSkippedInBrowser() && isCaptchaClientKeyConfigured());
  }, []);

  return required;
}
