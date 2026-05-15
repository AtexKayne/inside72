import Link from "next/link";
import { notFound } from "next/navigation";
import { getNews } from "@/lib/data-store";
import pages from "@/styles/pages.module.scss";

export const revalidate = 30;

export async function generateStaticParams() {
  const items = await getNews();
  return items.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const items = await getNews();
  const item = items.find((x) => x.id === id);
  if (!item) return { title: "Новость" };
  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical: `/news/${item.id}` },
    openGraph: { title: item.title, description: item.excerpt },
  };
}

export default async function NewsItemPage({ params }) {
  const { id } = await params;
  const items = await getNews();
  const item = items.find((x) => x.id === id);
  if (!item) notFound();

  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(item.createdAt));

  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <p style={{ margin: "0 0 0.5rem" }}>
          <Link href="/news" style={{ color: "#a3a3a3", fontSize: "0.9rem" }}>
            ← Все новости
          </Link>
        </p>
        <time className={pages.newsDate} dateTime={item.createdAt}>
          {date}
        </time>
        <h1 className={pages.title} style={{ marginTop: "0.5rem" }}>
          {item.title}
        </h1>
        <div className={pages.prose}>
          {item.body.split("\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
