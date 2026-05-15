import Link from "next/link";
import { getNews } from "@/lib/data-store";
import pages from "@/styles/pages.module.scss";

export const revalidate = 30;

export const metadata = {
  title: "Новости",
  description: "Новости танцевальной студии Inside: наборы, мастер-классы и события.",
  alternates: { canonical: "/news" },
};

function formatDate(iso) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function NewsPage() {
  const items = await getNews();

  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <h1 className={pages.h2}>Новости</h1>
        {items.length === 0 ? (
          <p className={pages.lead}>Пока нет опубликованных новостей.</p>
        ) : (
          items.map((n) => (
            <article key={n.id} className={pages.newsItem}>
              <time className={pages.newsDate} dateTime={n.createdAt}>
                {formatDate(n.createdAt)}
              </time>
              <h2 className={pages.newsTitle}>
                <Link href={`/news/${n.id}`}>{n.title}</Link>
              </h2>
              <p className={pages.newsExcerpt}>{n.excerpt}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
