import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TRIAL_TO = "asantepler@gmail.com";

function createMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? "587");
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

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

  const transporter = createMailer();
  if (!transporter) {
    return NextResponse.json(
      {
        error:
          "Отправка писем не настроена на сервере. Укажите SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM в переменных окружения.",
      },
      { status: 503 }
    );
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const text = [
    "Новая заявка на пробное занятие (студия Inside, хастл)",
    "",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Email: ${email || "—"}`,
    `Комментарий: ${comment || "—"}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to: TRIAL_TO,
      subject: `Inside — пробное: ${name}`,
      text,
      replyTo: email || undefined,
    });
  } catch (e) {
    console.error("trial mail error", e);
    return NextResponse.json({ error: "Не удалось отправить письмо. Попробуйте позже." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
