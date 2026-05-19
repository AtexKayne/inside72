import { organizationJsonLd } from "@/lib/seo";

export function JsonLdScript({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLd() {
  return <JsonLdScript data={organizationJsonLd()} />;
}
