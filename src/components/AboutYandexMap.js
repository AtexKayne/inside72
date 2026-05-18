import { siteContacts } from "@/lib/site-contacts";
import styles from "./about-yandex-map.module.scss";

export function AboutYandexMap({ embedded = false }) {
  const { map, address } = siteContacts;

  return (
    <figure
      className={`${styles.wrap} ${embedded ? styles.embedded : ""}`.trim()}
    >
      <iframe
        className={styles.frame}
        src={map.widgetUrl}
        title={`Карта — студия Inside, ${address.line}, ${address.city}`}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className={styles.vignette} aria-hidden="true" />
      <figcaption className={styles.badge}>
        {address.line} · {address.city}
      </figcaption>
      <a
        className={styles.openLink}
        href={map.openUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Открыть в Картах
      </a>
    </figure>
  );
}
