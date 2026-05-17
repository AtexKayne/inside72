"use client";

import { formatRuPhoneInput } from "@/lib/phone-mask";

export function PhoneInput({
  id,
  name = "phone",
  value,
  onChange,
  required = false,
  autoComplete = "tel",
  className,
}) {
  function handleChange(e) {
    onChange(formatRuPhoneInput(e.target.value));
  }

  function handleFocus() {
    if (!value) onChange("+7");
  }

  function handleBlur() {
    if (value === "+7") onChange("");
  }

  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      required={required}
      placeholder="+7 (___) ___-__-__"
      className={className}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
