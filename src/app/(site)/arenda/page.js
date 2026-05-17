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
        <h1 className={pages.h2}>{info.title}</h1>
        <p className={pages.lead} style={{ marginBottom: "1.5rem", maxWidth: "52ch" }}>
          {info.lead}
        </p>

        <HallRentalCalendar compact />

        <HallRentalInfoTabs />
      </div>
    </section>
  );
}
