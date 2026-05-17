/** Форматирует ввод в +7 (XXX) XXX-XX-XX */
export function formatRuPhoneInput(value) {
  let digits = String(value ?? "").replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.length > 0 && !digits.startsWith("7")) {
    digits = `7${digits}`;
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length === 1) return "+7";

  const local = digits.slice(1);
  let out = "+7";

  if (local.length > 0) {
    out += ` (${local.slice(0, 3)}`;
  }
  if (local.length >= 3) {
    out += ")";
    if (local.length > 3) out += ` ${local.slice(3, 6)}`;
  }
  if (local.length > 6) {
    out += `-${local.slice(6, 8)}`;
  }
  if (local.length > 8) {
    out += `-${local.slice(8, 10)}`;
  }

  return out;
}

export function getRuPhoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isRuPhoneComplete(value) {
  const digits = getRuPhoneDigits(value);
  return digits.length === 11 && digits.startsWith("7");
}
