import { HallRentalCalendar } from "@/components/HallRentalCalendar";
import { HallRentalInfoTabs } from "@/components/HallRentalInfoTabs";
import { hallRentalInfo } from "@/lib/hall-rental";
import pages from "@/styles/pages.module.scss";

export const metadata = {
  title: "Аренда зала",
  description:
    "Аренда танцевального зала Inside в Тюмени: разовая и постоянная почасовая аренда от 500 ₽/час. Запись по календарю, ул. Герцена, 82/1.",
  alternates: { canonical: "/arenda" },
};

export default function HallRentalPage() {
  const info = hallRentalInfo;

  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside</p>
          <h1 className={pages.pageTitle}>{info.title}</h1>
          <p className={pages.pageLead}>{info.lead}</p>
        </header>

        <HallRentalCalendar compact />

        <HallRentalInfoTabs />
      </div>
    </section>
  );
}
