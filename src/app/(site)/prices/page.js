import Link from "next/link";
import { JsonLdScript } from "@/components/JsonLd";
import { TrialCta } from "@/components/TrialCta";
import { getPricingContent } from "@/lib/data-store";
import { breadcrumbJsonLd, pageMetadata, pricingPageJsonLd } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";

export const metadata = pageMetadata({
  title: "Цены и акции",
  description:
    "Актуальные цены на занятия в студии INSIDE в Тюмени: абонементы, индивидуальные тренировки, самоподготовка и действующие акции.",
  pathname: "/prices",
});

export default async function PricesPage() {
  const pricing = await getPricingContent();

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Цены и акции", path: "/prices" },
        ])}
      />
      <JsonLdScript data={pricingPageJsonLd(pricing)} />

      <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>INSIDE · Тюмень</p>
          <h1 className={pages.pageTitle}>Цены и акции</h1>
          <p className={pages.pageLead}>
            Актуальный прайс студии. Если нужна помощь с выбором формата занятий, оставьте заявку —
            подскажем оптимальный вариант.
          </p>
        </header>

        <section className={pages.pricingBlock}>
          <h2 className={pages.h3}>Акции</h2>
          <article className={pages.pricingPromoCard}>
            {pricing.promotions.length > 0 ? (
              <ul className={pages.pricingList}>
                {pricing.promotions.map((promo) => (
                  <li key={promo.id} className={pages.pricingListItem}>
                    <div className={pages.pricingItemTitle}>{promo.title}</div>
                    {promo.details ? <div className={pages.pricingItemPrice}>{promo.details}</div> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={pages.pricingEmpty}>Сейчас акций нет.</p>
            )}
          </article>
        </section>

        <section className={pages.pricingBlock}>
          <h2 className={pages.h3}>Стоимость занятий</h2>
          <div className={pages.pricingSections}>
            {pricing.sections.map((section) => (
              <article key={section.id} className={pages.pricingCard}>
                <h3 className={pages.pricingTitle}>{section.title}</h3>
                {section.items.length > 0 ? (
                  <ul className={pages.pricingList}>
                    {section.items.map((item) => (
                      <li key={item.id} className={pages.pricingListItem}>
                        <div className={pages.pricingRow}>
                          <span className={pages.pricingItemTitle}>{item.title}</span>
                          {item.price ? <span className={pages.pricingItemPrice}>{item.price}</span> : null}
                        </div>
                        {item.note ? <div className={pages.pricingItemNote}>{item.note}</div> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={pages.pricingEmpty}>Позиции пока не добавлены.</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <div className={pages.ctaRow} style={{ marginTop: "2.5rem" }}>
          <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
          <Link className={`${pages.btn} ${pages.btnGhost}`} href="/about">
            О студии
          </Link>
        </div>
      </div>
      </section>
    </>
  );
}
