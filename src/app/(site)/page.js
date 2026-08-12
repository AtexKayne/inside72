import { HallPhotosSection } from "@/components/HallPhotosSection";
import { HallRentalCalendar } from "@/components/HallRentalCalendar";
import { HallRentalInfoTabs } from "@/components/HallRentalInfoTabs";
import { SiteContacts } from "@/components/SiteContacts";
import { hallRentalInfo } from "@/lib/hall-rental";
import { pageMetadata, siteSeo } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  ...pageMetadata({
    description:
      "Аренда танцевального зала в Тюмени: занятость по календарю, заявка онлайн, ул. Герцена, 82/1. Два зала от 80 м² от 500 ₽/час.",
    pathname: "/",
  }),
  title: { absolute: siteSeo.defaultTitle },
};

export default function HomePage() {
  const info = hallRentalInfo;

  return (
    <>
      <section id="rental" className={pages.section}>
        <div className={pages.inner}>
          <header className={pages.pageHero}>
            <p className={pages.pageKicker}>INSIDE · Тюмень</p>
            <h1 className={pages.pageTitle}>{info.title}</h1>
            <p className={pages.pageLead}>{info.lead}</p>
          </header>

          <HallRentalCalendar compact />

          <HallRentalInfoTabs />
        </div>
      </section>

      <HallPhotosSection />

      <section className={pages.section}>
        <div className={pages.inner}>
          <SiteContacts />
        </div>
      </section>
    </>
  );
}
