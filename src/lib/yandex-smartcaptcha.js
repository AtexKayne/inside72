const CAPTCHA_VALIDATE_URL = "https://smartcaptcha.yandexcloud.net/validate";

export const YANDEX_SMARTCAPTCHA_CLIENT_KEY =
  process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_CLIENT_KEY?.trim() || "";

export function isCaptchaClientKeyConfigured() {
  return Boolean(YANDEX_SMARTCAPTCHA_CLIENT_KEY);
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "";
}

export function isLocalhostHost(host) {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function isCaptchaSkippedForRequest(request) {
  return isLocalhostHost(request.headers.get("host") ?? "");
}

export function isCaptchaSkippedInBrowser() {
  if (typeof window === "undefined") return false;
  return isLocalhostHost(window.location.host);
}

export async function verifyCaptchaForRequest(request, token) {
  if (isCaptchaSkippedForRequest(request)) {
    return { ok: true };
  }
  return verifyYandexSmartCaptcha(token, getClientIp(request));
}

export async function verifyYandexSmartCaptcha(token, ip) {
  const secret = process.env.YANDEX_SMARTCAPTCHA_SERVER_KEY?.trim();
  if (!secret) {
    return { ok: false, reason: "not_configured" };
  }

  const trimmed = String(token ?? "").trim();
  if (!trimmed) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams({
    secret,
    token: trimmed,
  });
  if (ip) body.set("ip", ip);

  try {
    const res = await fetch(CAPTCHA_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(5000),
    });
    const text = await res.text();
    if (res.status !== 200) {
      console.error("yandex smartcaptcha validate error", res.status, text);
      return { ok: false, reason: "service_error" };
    }

    const data = JSON.parse(text);
    return data.status === "ok" ? { ok: true } : { ok: false, reason: "failed" };
  } catch (err) {
    console.error("yandex smartcaptcha validate error", err);
    return { ok: false, reason: "service_error" };
  }
}

export function captchaErrorResponse(result) {
  if (result.reason === "not_configured") {
    return {
      status: 503,
      error:
        "Проверка captcha не настроена: задайте YANDEX_SMARTCAPTCHA_SERVER_KEY (см. .env.example).",
    };
  }
  if (result.reason === "service_error") {
    return { status: 502, error: "Сервис проверки captcha недоступен. Попробуйте позже." };
  }
  return { status: 400, error: "Подтвердите, что вы не робот" };
}
