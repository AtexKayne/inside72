import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdScript } from "@/components/JsonLd";
import { NewsCard } from "@/components/NewsCard";
import { TrialCta } from "@/components/TrialCta";
import { getNews } from "@/lib/data-store";
import { breadcrumbJsonLd, newsArticleJsonLd, pageMetadata } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import styles from "./news-detail-page.module.scss";

export const revalidate = 30;

export async function generateStaticParams() {
  try {
    const items = await getNews();
    return items.map((n) => ({ id: n.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const items = await getNews();
  const item = items.find((x) => x.id === id);
  if (!item) {
    return {
      title: "Новость",
      robots: { index: false, follow: false },
    };
  }
  const ogImage = item.images?.[0];
  return pageMetadata({
    title: item.title,
    description: item.excerpt || item.title,
    pathname: `/news/${item.id}`,
    type: "article",
    publishedTime: item.createdAt,
    ...(ogImage ? { ogImage: { url: ogImage, alt: item.title } } : {}),
  });
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function bodyParagraphs(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function NewsItemPage({ params }) {
  const { id } = await params;
  const items = await getNews();
  const item = items.find((x) => x.id === id);
  if (!item) notFound();

  const dateLabel = formatDate(item.createdAt);
  const images = item.images ?? [];
  const [heroImage, ...restImages] = images;
  const paragraphs = bodyParagraphs(item.body);
  const related = items
    .filter((x) => x.id !== item.id)
    .slice(0, 3);

  const imageAlt = (index) =>
    index === 0 ? item.title : `${item.title} — фото ${index + 1}`;

  return (
    <section className={pages.section}>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Новости", path: "/news" },
          { name: item.title, path: `/news/${item.id}` },
        ])}
      />
      <JsonLdScript
        data={newsArticleJsonLd({
          title: item.title,
          description: item.excerpt || item.title,
          pathname: `/news/${item.id}`,
          publishedAt: item.createdAt,
          image: heroImage,
        })}
      />
      <div className={pages.inner}>
        <nav className={styles.nav} aria-label="Навигация">
          <Link href="/news" className={pages.backLink}>
            <svg
              className={pages.backLinkIcon}
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Все новости
          </Link>
        </nav>

        <header className={styles.hero}>
          <p className={pages.pageKicker}>INSIDE · Тюмень</p>
          <h1 className={styles.title}>{item.title}</h1>
          <time className={pages.pageLead} dateTime={item.createdAt}>
            {dateLabel}
          </time>
        </header>

        {heroImage ? (
          <div className={styles.gallery}>
            <figure className={styles.heroFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={imageAlt(0)}
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </figure>
            {restImages.length > 0 ? (
              <div className={styles.gridFigures}>
                {restImages.map((src, i) => (
                  <figure key={src} className={styles.gridFigure}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={imageAlt(i + 1)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.article}>
          <article className={styles.content}>
            <div className={styles.prose}>
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>

          <aside className={styles.aside} aria-label="Дополнительно">
            <div className={styles.asideCard}>
              <strong>Хочешь попробовать?</strong>
              <p>
                Запишись на открытый урок — познакомишься со студией, преподавателями и
                атмосферой.
              </p>
              <TrialCta className={`${pages.btn} ${styles.asideBtn}`}>
                Записаться на пробное
              </TrialCta>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.relatedHeading}>
              Другие новости
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((relatedItem, i) => (
                <NewsCard
                  key={relatedItem.id}
                  item={relatedItem}
                  dateLabel={formatDate(relatedItem.createdAt)}
                  index={i}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className={styles.ctaBand}>
          <div className={styles.ctaCopy}>
            <strong>Следи за событиями студии</strong>
            <p>
              Наборы, мастер-классы и отчёты с мероприятий — всё в разделе новостей.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link className={pages.btn} href="/news">
              Все новости
            </Link>
            <Link className={`${pages.btn} ${pages.btnGhost}`} href="/teachers">
              Преподаватели
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
