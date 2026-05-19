import Link from "next/link";
import styles from "./news-card.module.scss";

const MEDIA_VARIANTS = ["mediaPortrait", "mediaLandscape", "mediaSquare"];

/**
 * @param {{ item: { id: string; title: string; excerpt?: string; createdAt: string; images?: string[] }; dateLabel: string; variant?: "default" | "featured"; index?: number }} props
 */
export function NewsCard({ item, dateLabel, variant = "default", index = 0 }) {
  const href = `/news/${item.id}`;
  const image = item.images?.[0];

  if (variant === "featured") {
    return (
      <article className={styles.featured}>
        <Link
          href={href}
          className={`${styles.featuredLink} ${!image ? styles.featuredNoImage : ""}`}
        >
          {image ? (
            <figure className={styles.featuredMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={item.title}
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <span className={styles.featuredMediaOverlay} aria-hidden="true" />
            </figure>
          ) : null}
          <div
            className={`${styles.featuredBody} ${!image ? styles.featuredBodyOnly : ""}`}
          >
            <span className={styles.featuredBadge}>Свежее</span>
            <time className={styles.date} dateTime={item.createdAt}>
              {dateLabel}
            </time>
            <h2 className={styles.featuredTitle}>{item.title}</h2>
            {item.excerpt ? (
              <p className={styles.featuredExcerpt}>{item.excerpt}</p>
            ) : null}
            <span className={styles.featuredFooter}>
              Читать полностью
              <ArrowIcon className={styles.arrow} />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  const mediaVariant = MEDIA_VARIANTS[index % MEDIA_VARIANTS.length];

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.cardLink}>
        {image ? (
          <figure className={`${styles.media} ${styles[mediaVariant]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={item.title} loading="lazy" referrerPolicy="no-referrer" />
            <span className={styles.mediaOverlay} aria-hidden="true" />
          </figure>
        ) : null}
        <div className={styles.body}>
          <time className={styles.date} dateTime={item.createdAt}>
            {dateLabel}
          </time>
          <h2 className={styles.title}>{item.title}</h2>
          {item.excerpt ? <p className={styles.excerpt}>{item.excerpt}</p> : null}
          <span className={styles.footer}>
            Читать
            <ArrowIcon className={styles.arrow} />
          </span>
        </div>
      </Link>
    </article>
  );
}

function ArrowIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
