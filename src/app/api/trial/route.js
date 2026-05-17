import { NextResponse } from "next/server";
import { sendTrialEmail } from "@/lib/trial-mail";

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

  const result = await sendTrialEmail({
    subject: `Inside — пробное: ${name}`,
    text,
    replyTo: email || undefined,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if (result.reason === "not_configured" || result.reason === "missing_from") {
    return NextResponse.json(
      {
        error:
          "Отправка писем не настроена. На сервере задайте RESEND_API_KEY и RESEND_FROM (см. .env.example).",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Не удалось отправить письмо. Попробуйте позже." }, { status: 502 });
}
