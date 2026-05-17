import { NextResponse } from "next/server";
import { sendTrialEmail } from "@/lib/trial-mail";
import { sendTrialVkNotify } from "@/lib/trial-vk";
import { hasPersonalDataConsent } from "@/lib/personal-data-policy";
import { captchaErrorResponse, verifyCaptchaForRequest } from "@/lib/yandex-smartcaptcha";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const comment = String(body.comment ?? "").trim();
  const smartToken = String(body.smartToken ?? "").trim();

  if (!hasPersonalDataConsent(body.personalDataConsent)) {
    return NextResponse.json(
      { error: "Необходимо согласие на обработку персональных данных" },
      { status: 400 },
    );
  }

  const captchaResult = await verifyCaptchaForRequest(request, smartToken);
  if (!captchaResult.ok) {
    const { status, error } = captchaErrorResponse(captchaResult);
    return NextResponse.json({ error }, { status });
  }

  if (name.length < 2) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }

  const text = [
    "Новая заявка на пробное занятие (студия Inside, хастл)",
    "",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Email: ${email || "—"}`,
    `Комментарий: ${comment || "—"}`,
  ].join("\n");

  const [emailResult, vkResult] = await Promise.all([
    sendTrialEmail({
      subject: `Inside — пробное: ${name}`,
      text,
      replyTo: email || undefined,
    }),
    sendTrialVkNotify(text),
  ]);

  if (emailResult.ok || vkResult.ok) {
    return NextResponse.json({ ok: true });
  }

  const emailMissing =
    emailResult.reason === "not_configured" || emailResult.reason === "missing_from";
  const vkMissing = vkResult.reason === "not_configured";

  if (emailMissing && vkMissing) {
    return NextResponse.json(
      {
        error:
          "Заявки не настроены: задайте RESEND_API_KEY и/или VK_COMMUNITY_TOKEN + VK_TRIAL_NOTIFY_USER_IDS (см. .env.example).",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Не удалось отправить заявку. Попробуйте позже." }, { status: 502 });
}
