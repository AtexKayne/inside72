import { NextResponse } from "next/server";
import { formatBookingSlot, HALL_MIN_RENTAL_MINUTES } from "@/lib/hall-calendar";
import { DEFAULT_HALL_ID, getHallById, isValidHallId } from "@/lib/halls";
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
  const comment = String(body.comment ?? "").trim();
  const hallIdRaw = String(body.hallId ?? DEFAULT_HALL_ID).trim();
  const hall = isValidHallId(hallIdRaw) ? getHallById(hallIdRaw) : getHallById(DEFAULT_HALL_ID);
  const slotStartRaw = String(body.slotStart ?? "").trim();
  const slotEndRaw = String(body.slotEnd ?? "").trim();
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

  const slotStart = new Date(slotStartRaw);
  const slotEnd = new Date(slotEndRaw);
  if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime()) || slotEnd <= slotStart) {
    return NextResponse.json({ error: "Некорректное время записи" }, { status: 400 });
  }

  const durationMin = (slotEnd.getTime() - slotStart.getTime()) / 60_000;
  if (durationMin < HALL_MIN_RENTAL_MINUTES) {
    return NextResponse.json({ error: "Минимальная аренда — 1 час" }, { status: 400 });
  }

  const slotLabel = formatBookingSlot(slotStart, slotEnd);

  const text = [
    "Новая заявка на аренду зала (студия Inside)",
    "",
    `Зал: ${hall.label}`,
    `Время: ${slotLabel}`,
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Комментарий: ${comment || "—"}`,
  ].join("\n");

  const [emailResult, vkResult] = await Promise.all([
    sendTrialEmail({
      subject: `Inside — ${hall.label}: ${name}`,
      text,
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
