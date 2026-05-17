"use client";

import Link from "next/link";
import { PRIVACY_POLICY_PATH } from "@/lib/personal-data-policy";
import pages from "@/styles/pages.module.scss";

export function PersonalDataConsent({ id, checked, onChange, className }) {
  return (
    <label className={[pages.consent, className].filter(Boolean).join(" ")}>
      <span className={pages.consentControl}>
        <input
          id={id}
          name="personalDataConsent"
          type="checkbox"
          className={pages.consentInput}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
        />
        <span className={pages.consentBox} aria-hidden="true">
          <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 5.2 4.1 8.3 11 1.4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <span className={pages.consentText}>
        Я соглашаюсь с{" "}
        <Link href={PRIVACY_POLICY_PATH} target="_blank" rel="noopener noreferrer">
          политикой обработки персональных данных
        </Link>{" "}
        для связи по заявке
      </span>
    </label>
  );
}
