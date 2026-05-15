import { getSiteUrl } from "@/lib/site";

export function JsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "DanceSchool",
    name: "Inside",
    description: "Танцевальная студия Inside — обучение парному танцу хастл в Москве.",
    url,
    image: `${url}/og.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Москва",
      addressCountry: "RU",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
