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
    icons: [
      { src: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
