import nodemailer from "nodemailer";

const TRIAL_TO = process.env.TRIAL_NOTIFY_TO ?? "asantepler@gmail.com";

function createSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000,
  });
}

async function sendViaResend({ from, subject, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const fromAddress = from ?? process.env.RESEND_FROM ?? process.env.SMTP_FROM;
  if (!fromAddress) {
    return { ok: false, reason: "missing_from", error: new Error("RESEND_FROM or SMTP_FROM is required") };
  }

  const payload = {
    from: fromAddress,
    to: [TRIAL_TO],
    subject,
    text,
  };
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, reason: "api_error", error: new Error(`Resend ${res.status}: ${body}`) };
  }

  return { ok: true, via: "resend" };
}

async function sendViaSmtp({ from, subject, text, replyTo }) {
  const transporter = createSmtpTransport();
  if (!transporter) return { ok: false, reason: "not_configured" };

  try {
    await transporter.sendMail({
      from,
      to: TRIAL_TO,
      subject,
      text,
      replyTo: replyTo || undefined,
    });
    return { ok: true, via: "smtp" };
  } catch (error) {
    return { ok: false, reason: "smtp_error", error };
  }
}

/**
 * @param {{ subject: string, text: string, replyTo?: string }} mail
 */
export async function sendTrialEmail(mail) {
  const from = process.env.RESEND_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const payload = { from, ...mail };

  if (process.env.RESEND_API_KEY) {
    const resend = await sendViaResend(payload);
    if (resend.ok) return resend;
    console.error("trial mail resend error", resend.error);
    if (!createSmtpTransport()) return resend;
  }

  const smtp = await sendViaSmtp(payload);
  if (smtp.ok) return smtp;
  if (smtp.reason === "not_configured") {
    return {
      ok: false,
      reason: "not_configured",
      error: new Error(
        "Укажите RESEND_API_KEY и RESEND_FROM (рекомендуется на Vercel) или SMTP_HOST, SMTP_USER, SMTP_PASS.",
      ),
    };
  }

  console.error("trial mail smtp error", smtp.error);
  return smtp;
}
