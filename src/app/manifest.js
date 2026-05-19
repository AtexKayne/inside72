import { siteSeo } from "@/lib/seo";

export default function manifest() {
  return {
    name: siteSeo.defaultTitle,
    short_name: siteSeo.name,
    description: siteSeo.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "ru",
  };
}
