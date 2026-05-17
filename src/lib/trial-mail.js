import nodemailer from "nodemailer";

const TRIAL_TO = process.env.TRIAL_NOTIFY_TO ?? "asantepler@gmail.com";
/** Работает без верификации домена в Resend */
const RESEND_FROM_FALLBACK = "Inside Studio <onboarding@resend.dev>";

function isResendSafeFrom(from) {
  if (!from) return false;
  if (from.includes("@inside72.ru")) return false;
  if (/@gmail\.com|@googlemail\.com/i.test(from)) return false;
  return true;
}

function resolveResendFrom(explicit) {
  if (isResendSafeFrom(explicit)) return explicit;
  const env = process.env.RESEND_FROM?.trim();
  if (isResendSafeFrom(env)) return env;
  return RESEND_FROM_FALLBACK;
}

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

  const fromAddress = resolveResendFrom(from);

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
  const payload = { ...mail };

  if (process.env.RESEND_API_KEY) {
    const resend = await sendViaResend(payload);
    if (!resend.ok) console.error("trial mail resend error", resend.error);
    return resend;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const smtp = await sendViaSmtp({ from, ...payload });
  if (smtp.ok) return smtp;
  if (smtp.reason === "not_configured") {
    return {
      ok: false,
      reason: "not_configured",
      error: new Error(
        "Укажите RESEND_API_KEY (на Vercel → Environment Variables) или SMTP_HOST, SMTP_USER, SMTP_PASS.",
      ),
    };
  }

  console.error("trial mail smtp error", smtp.error);
  return smtp;
}
