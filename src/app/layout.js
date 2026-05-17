import "@/styles/globals.scss";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Inside — студия танца хастл",
    template: "%s | Inside",
  },
  description:
    "Танцевальная студия Inside: обучение хастлу, группы с нуля, пробное занятие. Москва.",
  keywords: ["хастл", "танцы", "студия Inside", "парный танец", "обучение танцам", "Inside"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Inside",
    title: "Inside — студия танца хастл",
    description: "Обучение хастлу в студии Inside. Новости, фото, запись на пробное.",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Inside" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inside — студия танца хастл",
    description: "Обучение хастлу в студии Inside.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <JsonLd />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
