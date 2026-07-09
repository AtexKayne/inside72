import { getNews } from "@/lib/data-store";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap() {
  const base = getSiteUrl();
  const news = await getNews();

  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" },
    { path: "/teachers", priority: 0.9, changeFrequency: "monthly" },
    { path: "/arenda", priority: 0.8, changeFrequency: "weekly" },
    { path: "/prices", priority: 0.8, changeFrequency: "weekly" },
    { path: "/news", priority: 0.8, changeFrequency: "daily" },
    { path: "/gallery", priority: 0.7, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticUrls = staticPaths.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const newsUrls = news.map((n) => ({
    url: `${base}/news/${n.id}`,
    lastModified: new Date(n.createdAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticUrls, ...newsUrls];
}
