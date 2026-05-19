"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildAlexanderMessage,
  copyTextToClipboard,
  getAlexanderMessengerUrls,
} from "@/lib/alexander-contacts";
import pages from "@/styles/pages.module.scss";
import styles from "./contact-alexander-links.module.scss";

const LINKS_BY_INTENT = {
  trial: [
    { id: "vk", label: "ВКонтакте" },
    { id: "telegram", label: "Telegram" },
  ],
  "hall-booking": [
    { id: "vk", label: "ВКонтакте" },
    { id: "avito", label: "Авито" },
    { id: "telegram", label: "Telegram" },
  ],
};

/**
 * @param {{
 *   idPrefix?: string;
 *   intent: "trial" | "hall-booking";
 *   name?: string;
 *   phone?: string;
 *   comment?: string;
 *   hallLabel?: string;
 *   slotLabel?: string;
 * }} props
 */
export function ContactAlexanderPanel({
  idPrefix = "alexander",
  intent,
  name = "",
  phone = "",
  comment = "",
  hallLabel = "",
  slotLabel = "",
}) {
  const [copied, setCopied] = useState(false);

  const generated = useMemo(
    () =>
      buildAlexanderMessage({
        intent,
        name,
        phone,
        comment,
        hallLabel,
        slotLabel,
      }),
    [intent, name, phone, comment, hallLabel, slotLabel],
  );

  const [messageText, setMessageText] = useState(generated);

  useEffect(() => {
    setMessageText(generated);
  }, [generated]);

  const urls = useMemo(() => getAlexanderMessengerUrls(messageText), [messageText]);
  const links = LINKS_BY_INTENT[intent] ?? LINKS_BY_INTENT.trial;
  const textareaId = `${idPrefix}-message`;

  const onCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(messageText);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  }, [messageText]);

  return (
    <div className={styles.panel}>
      <p className={styles.lead}>
        Скопируйте текст и отправьте его Александру в удобном мессенджере:
      </p>

      <div className={pages.field}>
        <label htmlFor={textareaId}>Текст сообщения</label>
        <textarea
          id={textareaId}
          className={styles.messageTextarea}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={6}
          aria-describedby={`${textareaId}-hint`}
        />
        <p id={`${textareaId}-hint`} className={styles.hint}>
          Можно отредактировать вручную. При изменении заявки на соседней вкладке текст
          пересоберётся заново.
        </p>
      </div>

      <div className={styles.copyRow}>
        <button className={`${pages.btn} ${pages.btnGhost}`} type="button" onClick={onCopy}>
          {copied ? "Скопировано" : "Скопировать текст"}
        </button>
        {copied ? (
          <span className={styles.copyOk} role="status">
            Вставьте в чат (Ctrl+V)
          </span>
        ) : null}
      </div>

      <p className={styles.linksLead}>Открыть мессенджер:</p>
      <div className={styles.links}>
        {links.map(({ id, label }) => (
          <a
            key={id}
            className={styles.link}
            href={urls[id]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
