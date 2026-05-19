import { NewsCard } from "@/components/NewsCard";
import { getNews } from "@/lib/data-store";
import { pageMetadata } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import styles from "./news-page.module.scss";

export const revalidate = 30;

export const metadata = pageMetadata({
  title: "Новости",
  description:
    "Новости студии хастла Inside в Тюмени: наборы в группы, мастер-классы и события сообщества.",
  pathname: "/news",
});

function formatDate(iso) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function pluralMaterials(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "материалов";
  if (mod10 === 1) return "материал";
  if (mod10 >= 2 && mod10 <= 4) return "материала";
  return "материалов";
}

export default async function NewsPage() {
  const items = await getNews();

  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside</p>
          <h1 className={pages.pageTitle}>Новости</h1>
          <p className={pages.pageLead}>
            Наборы, мастер-классы, отчёты с мероприятий и всё, что происходит в студии.
          </p>
          {items.length > 0 ? (
            <div className={styles.meta}>
              <span className={styles.count}>
                {items.length} {pluralMaterials(items.length)}
              </span>
            </div>
          ) : null}
        </header>

        {items.length === 0 ? (
          <p className={styles.empty}>Пока нет опубликованных новостей.</p>
        ) : items.length === 1 ? (
          <NewsCard item={items[0]} dateLabel={formatDate(items[0].createdAt)} variant="featured" />
        ) : (
          <>
            <NewsCard
              item={items[0]}
              dateLabel={formatDate(items[0].createdAt)}
              variant="featured"
            />
            <div className={styles.masonry}>
              {items.slice(1).map((item, i) => (
                <div key={item.id} className={styles.masonryItem}>
                  <NewsCard
                    item={item}
                    dateLabel={formatDate(item.createdAt)}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
