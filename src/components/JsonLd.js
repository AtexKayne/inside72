import { hallRentalInfo } from "@/lib/hall-rental";
import { siteJsonLdGraph } from "@/lib/seo";

export function JsonLdScript({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Статичные цены аренды — без обращения к БД на каждый запрос. */
function rentalPricingForJsonLd() {
  return {
    promotions: [],
    sections: [
      {
        id: "hall-rental",
        title: "Аренда зала",
        items: hallRentalInfo.pricing.map((row, index) => ({
          id: `hall-price-${index}`,
          title: row.label,
          price: row.price.replace(/[^\d]/g, ""),
          note: row.price,
        })),
      },
    ],
  };
}

export function JsonLd() {
  return <JsonLdScript data={siteJsonLdGraph(rentalPricingForJsonLd())} />;
}
