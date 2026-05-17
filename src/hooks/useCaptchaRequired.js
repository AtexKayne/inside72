"use client";

import { useEffect, useState } from "react";
import { isCaptchaSkippedInBrowser } from "@/lib/yandex-smartcaptcha";

/** null — ещё не определено (гидрация); true — captcha нужна; false — localhost */
export function useCaptchaRequired() {
  const [required, setRequired] = useState(null);

  useEffect(() => {
    setRequired(!isCaptchaSkippedInBrowser());
  }, []);

  return required;
}
