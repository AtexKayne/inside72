import { getPricingContent } from "@/lib/data-store";
import { siteJsonLdGraph } from "@/lib/seo";

export function JsonLdScript({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function JsonLd() {
  const pricing = await getPricingContent();
  return <JsonLdScript data={siteJsonLdGraph(pricing)} />;
}
