import { SiteContacts } from "@/components/SiteContacts";
import pages from "@/styles/pages.module.scss";
import { TrialCtaLink } from "@/components/TrialCtaLink";

export const metadata = {
  title: "О нас",
  description:
    "Студия Inside: преподаватели, адрес на ул. Герцена, часы работы и как добраться до зала.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside</p>
          <h1 className={pages.pageTitle}>О студии Inside</h1>
          <p className={pages.pageLead}>
            Парный танец, который легко освоить с нуля. Занятия в центре Тюмени — группы для
            начинающих стартуют каждый месяц.
          </p>
        </header>
        <div className={pages.prose}>
          <p>
            Мы танцуем хастл — парный танец, который легко освоить с нуля и можно танцевать под любую музыку где угодно: хоть в баре, хоть в парке, хоть на набережной.
          </p>
          <p>Занятия проходят в центре Тюмени — 200 м от ЦУМа.</p>

          <strong>У нас ты:</strong>
          <ul>
            <li>Научишься танцевать с разными людьми — без зажатости и стресса.</li>
            <li>Быстро вырастешь в танце — если захочешь, даже до соревнований. С нами затанцует любой, проверено.</li>
            <li>Попадёшь в тусовку, где не только танцуют, но и вместе растут, поддерживают друг друга и создают вместе драйвовые проекты.</li>
          </ul>
          <p>
            Пара не нужна — 70% наших учеников приходят одни.
            Через 3 месяца — ты уже танцуешь и кайфуешь от себя.
            Опыт в танцах не нужен. Затанцевать с нуля абсолютно реально, мы сами так начинали.

            Начни танцевать с нами —{" "}
            <TrialCtaLink className={pages.proseLink}>
              запишись на ближайший открытый урок
            </TrialCtaLink>
          </p>
        </div>

        <section id="contacts" aria-labelledby="contacts-heading">
          <SiteContacts showTitle />
        </section>
      </div>
    </section>
  );
}
