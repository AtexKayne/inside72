/** Контакты Александра для прямой связи из форм заявок */
export const alexanderContacts = {
  vk: "https://vk.com/im/convo/8800243",
  avito:
    "https://www.avito.ru/tyumen/predlozheniya_uslug/arenda_tantsevalnogo_zala_82m_3465509060",
  telegramUsername: "Alexander_Rezchikov",
};

/**
 * @param {{
 *   intent: "trial" | "hall-booking";
 *   name?: string;
 *   phone?: string;
 *   comment?: string;
 *   hallLabel?: string;
 *   slotLabel?: string;
 * }} params
 */
export function buildAlexanderMessage({
  intent,
  name,
  phone,
  comment,
  hallLabel,
  slotLabel,
}) {
  const lines = ["Здравствуйте, Александр!"];

  if (intent === "trial") {
    lines.push("Я хочу записаться к вам на пробный урок.");
  } else if (intent === "hall-booking") {
    lines.push("Я хочу забронировать зал для аренды.");
    if (hallLabel?.trim()) {
      lines.push(`Зал: ${hallLabel.trim()}.`);
    }
    if (slotLabel?.trim()) {
      lines.push(`Время: ${slotLabel.trim()}.`);
    }
  }

  if (name?.trim()) {
    lines.push(`Имя: ${name.trim()}.`);
  }
  if (phone?.trim()) {
    lines.push(`Телефон: ${phone.trim()}.`);
  }
  if (comment?.trim()) {
    lines.push(`Комментарий: ${comment.trim()}.`);
  }

  return lines.join(" ");
}

/**
 * @param {string} message
 * @returns {{ vk: string; avito: string; telegram: string }}
 */
export function getAlexanderMessengerUrls(message) {
  const encoded = encodeURIComponent(message);

  return {
    vk: alexanderContacts.vk,
    avito: alexanderContacts.avito,
    telegram: `https://t.me/${alexanderContacts.telegramUsername}?text=${encoded}`,
  };
}

/** @param {string} text */
export async function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback ниже
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}
