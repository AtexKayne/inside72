import "@/styles/globals.scss";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getSiteUrl } from "@/lib/site";
import { pageMetadata, siteSeo } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteSeo.defaultTitle,
    template: siteSeo.titleTemplate,
  },
  description: siteSeo.defaultDescription,
  keywords: siteSeo.keywords,
  openGraph: pageMetadata({ pathname: "/" }).openGraph,
  twitter: pageMetadata({ pathname: "/" }).twitter,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <JsonLd />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
