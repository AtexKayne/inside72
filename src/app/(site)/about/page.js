import Link from "next/link";
import { SiteContacts } from "@/components/SiteContacts";
import { TrialCta } from "@/components/TrialCta";
import { pageMetadata } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import styles from "./about-page.module.scss";

export const metadata = pageMetadata({
  title: "О студии",
  description:
    "Студия хастла Inside в Тюмени: адрес на ул. Герцена, 82/1, часы работы, как добраться и записаться на пробное занятие.",
  pathname: "/about",
});

const stats = [
  { value: "70%", label: "приходят без пары" },
  { value: "3 мес.", label: "до уверенного танца" },
  { value: "200 м", label: "от ЦУМа" },
];

const values = [
  {
    index: "01",
    title: "Танцуешь с разными людьми",
    text: "Без зажатости и стресса — меняешь партнёров на занятиях и на вечеринках.",
  },
  {
    index: "02",
    title: "Растёшь в своём темпе",
    text: "От первых шагов до соревнований — если захочешь. С нами затанцует любой, проверено.",
  },
  {
    index: "03",
    title: "Попадаешь в тусовку",
    text: "Где поддерживают, растут вместе и создают драйвовые проекты — не только танцуют.",
  },
];

export default function AboutPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside · Тюмень</p>
          <h1 className={pages.pageTitle}>О студии Inside</h1>
          <p className={pages.pageLead}>
            Парный танец, который легко освоить с нуля. Занятия в центре города — группы для
            начинающих стартуют каждый месяц.
          </p>
          <div className={styles.stats} aria-label="Ключевые факты">
            {stats.map((item) => (
              <div key={item.value} className={styles.stat}>
                <span className={styles.statValue}>{item.value}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </header>

        <div className={styles.storyGrid}>
          <div className={styles.storyMain}>
            <h2>Хастл — танец без границ</h2>
            <p>
              Мы танцуем хастл — парный танец, который легко освоить с нуля и можно танцевать под
              любую музыку где угодно: в баре, в парке или на набережной.
            </p>
            <p>
              Занятия проходят в центре Тюмени — в двухстах метрах от ЦУМа. Опыт в танцах не
              нужен: затанцевать с нуля абсолютно реально, мы сами так начинали.
            </p>
          </div>
          <aside className={styles.storyAside}>
            <strong>Пара не нужна</strong>
            <p>
              Большинство учеников приходят одни. Через три месяца вы уже танцуете и кайфуете от
              себя — системная методика и внимательные преподаватели делают путь понятным с первого
              занятия.
            </p>
          </aside>
        </div>

        <section className={styles.valuesSection} aria-labelledby="values-heading">
          <h2 id="values-heading" className={styles.valuesHeading}>
            У нас ты
          </h2>
          <div className={styles.valuesGrid}>
            {values.map((item) => (
              <article key={item.index} className={styles.valueCard}>
                <span className={styles.valueIndex} aria-hidden="true">
                  {item.index}
                </span>
                <h3 className={styles.valueTitle}>{item.title}</h3>
                <p className={styles.valueText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.ctaBand}>
          <div className={styles.ctaCopy}>
            <strong>Начни с открытого урока</strong>
            <p>
              Первое занятие — знакомство со студией, преподавателями и атмосферой. Запишись на
              ближайший открытый урок — подберём удобное время.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
            <Link className={`${pages.btn} ${pages.btnGhost}`} href="/teachers">
              Преподаватели
            </Link>
          </div>
        </div>

        <SiteContacts />
      </div>
    </section>
  );
}
