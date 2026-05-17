import { getNews } from "@/lib/data-store";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap() {
  const base = getSiteUrl();
  const news = await getNews();

  const staticUrls = ["", "/news", "/gallery", "/teachers", "/arenda", "/about"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const newsUrls = news.map((n) => ({
    url: `${base}/news/${n.id}`,
    lastModified: new Date(n.createdAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticUrls, ...newsUrls];
}
