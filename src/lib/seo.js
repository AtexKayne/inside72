import { siteContacts } from "@/lib/site-contacts";
import { getSiteUrl } from "@/lib/site";

export const siteSeo = {
  name: "Inside",
  defaultTitle: "Inside — студия хастла в Тюмени",
  titleTemplate: "%s | Inside",
  defaultDescription:
    "Танцевальная студия Inside в Тюмени: социальный хастл с нуля, группы каждый месяц, пробное занятие. ул. Герцена, 82/1.",
  locale: "ru_RU",
  ogImage: "/og.svg",
  keywords: [
    "хастл",
    "социальный хастл",
    "танцы Тюмень",
    "студия танцев Тюмень",
    "парный танец",
    "обучение хастлу",
    "Inside",
    "Inside dance",
    "пробное занятие танцы",
    "аренда зала Тюмень",
  ],
};

/**
 * @param {{
 *   title?: string;
 *   description?: string;
 *   pathname: string;
 *   ogImage?: string | { url: string; width?: number; height?: number; alt?: string };
 *   type?: "website" | "article";
 *   publishedTime?: string;
 *   noIndex?: boolean;
 * }} options
 */
export function pageMetadata({
  title,
  description = siteSeo.defaultDescription,
  pathname,
  ogImage,
  type = "website",
  publishedTime,
  noIndex = false,
}) {
  const base = getSiteUrl();
  const canonical = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = `${base}${canonical === "/" ? "" : canonical}`;
  const fullTitle = title ? `${title} | ${siteSeo.name}` : siteSeo.defaultTitle;

  const image =
    typeof ogImage === "string"
      ? { url: ogImage, width: 1200, height: 630, alt: siteSeo.name }
      : ogImage ?? {
          url: siteSeo.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteSeo.name} — студия хастла в Тюмени`,
        };

  const openGraph = {
    type,
    locale: siteSeo.locale,
    url,
    siteName: siteSeo.name,
    title: fullTitle,
    description,
    images: [image],
    ...(type === "article" && publishedTime
      ? { publishedTime, modifiedTime: publishedTime }
      : {}),
  };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [typeof image === "object" && "url" in image ? image.url : image],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Schema.org DanceSchool + LocalBusiness для главной и контактов */
export function organizationJsonLd() {
  const url = getSiteUrl();
  const { address, phone, vk, hours, map } = siteContacts;
  const streetAddress = `${address.line}, ${address.city}`;

  return {
    "@context": "https://schema.org",
    "@type": ["DanceSchool", "LocalBusiness"],
    name: siteSeo.name,
    description: siteSeo.defaultDescription,
    url,
    image: `${url}${siteSeo.ogImage}`,
    telephone: phone.tel,
    openingHours: hours,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.line,
      addressLocality: address.city,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: map.lat,
      longitude: map.lon,
    },
    sameAs: [vk.url],
  };
}

/**
 * @param {{ title: string; description: string; pathname: string; publishedAt: string; image?: string }} article
 */
export function newsArticleJsonLd({ title, description, pathname, publishedAt, image }) {
  const base = getSiteUrl();
  const url = `${base}${pathname}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      "@type": "Organization",
      name: siteSeo.name,
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: siteSeo.name,
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}${siteSeo.ogImage}`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(image ? { image: [image] } : {}),
  };
}

/** BreadcrumbList для внутренних страниц */
export function breadcrumbJsonLd(items) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
