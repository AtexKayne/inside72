import Link from "next/link";
import { HallRentalCalendar } from "@/components/HallRentalCalendar";
import { hallRentalInfo } from "@/lib/hall-rental";
import { siteContacts } from "@/lib/site-contacts";
import pages from "@/styles/pages.module.scss";

export const metadata = {
  title: "Аренда зала",
  description:
    "Аренда зала студии Inside в Тюмени: самостоятельная подготовка 150 ₽, запись по календарю. ул. Герцена, 82/1.",
  alternates: { canonical: "/arenda" },
};

export default function HallRentalPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <h1 className={pages.h2}>{hallRentalInfo.title}</h1>
        <p className={pages.lead} style={{ marginBottom: "1.5rem", maxWidth: "52ch" }}>
          {hallRentalInfo.lead}
        </p>

        <div className={pages.cardGrid} style={{ marginBottom: "2.5rem" }}>
          <article className={pages.card}>
            <h3>Стоимость</h3>
            <p>
              <strong style={{ color: "#fafafa", fontSize: "1.35rem" }}>{hallRentalInfo.price}</strong>
              <br />
              {hallRentalInfo.priceNote}
            </p>
          </article>
          <article className={pages.card}>
            <h3>Часы работы зала</h3>
            <p>{hallRentalInfo.hours}</p>
          </article>
          <article className={pages.card}>
            <h3>Контакты</h3>
            <p>
              <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
              <br />
              {siteContacts.address.line}, {siteContacts.address.city}
            </p>
          </article>
        </div>

        <div className={pages.prose} style={{ marginBottom: "2rem" }}>
          <ul style={{ marginTop: 0, color: "#a3a3a3", paddingLeft: "1.1rem" }}>
            {hallRentalInfo.rules.map((rule) => (
              <li key={rule} style={{ marginBottom: "0.5rem" }}>
                {rule}
              </li>
            ))}
          </ul>
          <p>
            Вопросы по записи —{" "}
            <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
              напишите нам ВКонтакте
            </a>{" "}
            или позвоните{" "}
            <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>.
          </p>
        </div>

        <HallRentalCalendar />

        <p style={{ marginTop: "2rem" }}>
          <Link className={pages.btn} href="/#trial">
            Запись на пробное занятие
          </Link>
        </p>
      </div>
    </section>
  );
}
