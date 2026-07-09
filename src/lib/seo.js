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
    "школа танцев",
    "Танцы для взрослых",
    "танцы Тюмень",
    "студия танцев Тюмень",
    "парный танец",
    "обучение хастлу",
    "Inside",
    "пробное занятие танцы",
    "аренда танцевального зала Тюмень",
  ],
};

function resolveMediaUrl(base, mediaUrl) {
  const raw = String(mediaUrl ?? "").trim();
  if (!raw) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

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

  const imageSource =
    typeof ogImage === "string"
      ? { url: ogImage, width: 1200, height: 630, alt: siteSeo.name }
      : ogImage ?? {
          url: siteSeo.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteSeo.name} — студия хастла в Тюмени`,
        };

  const image = {
    ...imageSource,
    url: resolveMediaUrl(base, imageSource.url),
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
    ...(!noIndex ? { alternates: { canonical: url } } : {}),
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

const OPENING_HOURS = {
  dayOfWeek: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  opens: "09:00",
  closes: "22:00",
};

/** Извлекает числовую цену в рублях из произвольной строки прайса */
export function parseRubAmount(priceText) {
  const raw = String(priceText ?? "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("бесплат")) return 0;
  if (lower.includes("%")) return null;
  const match = raw.replace(/\s/g, "").match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * @param {import("@/lib/pricing-content").ReturnType<import("@/lib/pricing-content").createDefaultPricingContent>} pricing
 * @param {string} pricesUrl
 */
export function buildOffersFromPricing(pricing, pricesUrl) {
  const offers = [];

  for (const promo of pricing.promotions ?? []) {
    const price = parseRubAmount(promo.details);
    offers.push({
      "@type": "Offer",
      name: promo.title,
      ...(promo.details ? { description: promo.details } : {}),
      ...(price !== null ? { price: String(price), priceCurrency: "RUB" } : {}),
      availability: "https://schema.org/InStock",
      url: pricesUrl,
      category: "Акция",
    });
  }

  for (const section of pricing.sections ?? []) {
    for (const item of section.items ?? []) {
      const price = parseRubAmount(item.price);
      if (price === null) continue;
      offers.push({
        "@type": "Offer",
        name: item.title,
        description: [section.title, item.note].filter(Boolean).join(" — ") || section.title,
        price: String(price),
        priceCurrency: "RUB",
        availability: "https://schema.org/InStock",
        url: pricesUrl,
        category: section.title,
      });
    }
  }

  return offers;
}

/** @param {Array<{ price?: string }>} offers */
function buildPriceRange(offers) {
  const amounts = offers
    .map((offer) => Number(offer.price))
    .filter((value) => Number.isFinite(value));
  if (amounts.length === 0) return undefined;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min === max) return `₽${min}`;
  return `₽${min}–₽${max}`;
}

function buildOrganizationNode(pricing) {
  const url = getSiteUrl();
  const pricesUrl = `${url}/prices`;
  const orgId = `${url}/#organization`;
  const { address, phone, vk, hours, map } = siteContacts;
  const offers = buildOffersFromPricing(pricing, pricesUrl);
  const priceRange = buildPriceRange(offers);

  return {
    "@type": ["DanceSchool", "LocalBusiness"],
    "@id": orgId,
    name: siteSeo.name,
    description: siteSeo.defaultDescription,
    url,
    image: `${url}${siteSeo.ogImage}`,
    logo: {
      "@type": "ImageObject",
      url: `${url}${siteSeo.ogImage}`,
    },
    telephone: phone.tel,
    openingHours: hours,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        ...OPENING_HOURS,
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: address.line,
      addressLocality: address.city,
      addressRegion: "Тюменская область",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: map.lat,
      longitude: map.lon,
    },
    hasMap: map.openUrl,
    areaServed: {
      "@type": "City",
      name: address.city,
    },
    currenciesAccepted: "RUB",
    ...(priceRange ? { priceRange } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: phone.tel,
      contactType: "customer service",
      availableLanguage: ["Russian"],
      areaServed: "RU",
    },
    sameAs: [vk.url],
    ...(offers.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Цены и акции Inside",
            url: pricesUrl,
            itemListElement: offers,
          },
          makesOffer: offers,
        }
      : {}),
  };
}

/**
 * Полный граф Schema.org для всего сайта (WebSite + организация с актуальными ценами).
 * @param {ReturnType<import("@/lib/pricing-content").createDefaultPricingContent>} pricing
 */
export function siteJsonLdGraph(pricing) {
  const url = getSiteUrl();
  const orgId = `${url}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: siteSeo.name,
        description: siteSeo.defaultDescription,
        inLanguage: "ru-RU",
        publisher: { "@id": orgId },
      },
      buildOrganizationNode(pricing),
    ],
  };
}

/** @deprecated Используйте siteJsonLdGraph — оставлено для обратной совместимости */
export function organizationJsonLd(pricing) {
  if (pricing) return siteJsonLdGraph(pricing);
  const url = getSiteUrl();
  const { address, phone, vk, hours, map } = siteContacts;

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
 * Schema.org для страницы цен: WebPage + OfferCatalog с актуальным прайсом.
 * @param {ReturnType<import("@/lib/pricing-content").createDefaultPricingContent>} pricing
 */
export function pricingPageJsonLd(pricing) {
  const base = getSiteUrl();
  const url = `${base}/prices`;
  const offers = buildOffersFromPricing(pricing, url);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: "Цены и акции | Inside",
    description:
      "Актуальные цены на занятия в студии Inside в Тюмени: абонементы, индивидуальные тренировки, самоподготовка и действующие акции.",
    inLanguage: "ru-RU",
    isPartOf: { "@id": `${base}/#website` },
    about: { "@id": `${base}/#organization` },
    mainEntity: {
      "@type": "OfferCatalog",
      name: "Цены и акции Inside",
      url,
      itemListElement: offers,
    },
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
