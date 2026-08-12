import { getSiteUrl } from "@/lib/site";

export default async function sitemap() {
  const base = getSiteUrl();

  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  ];

  return staticPaths.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
