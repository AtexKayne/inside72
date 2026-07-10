import Link from "next/link";
import { TrialCta } from "@/components/TrialCta";
import {
  teachers,
  teachersIntro,
  teachersOutro,
  teachersValues,
} from "@/lib/teachers";
import { pageMetadata } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import styles from "./teachers-page.module.scss";

export const metadata = pageMetadata({
  title: "Преподаватели",
  description:
    "Преподаватели студии INSIDE в Тюмени — Александр Резчиков и Ольга Иванова. Хастл с нуля, системное обучение и опыт в парном танце.",
  pathname: "/teachers",
});

const stats = [
  { value: "100+", label: "танцоров с нуля" },
  { value: "9+ лет", label: "в хастле у основателей" },
  { value: "2", label: "преподавателя-основателя" },
];

const philosophy = [
  {
    index: "01",
    title: "Система в обучении",
    text: teachersValues[0],
  },
  {
    index: "02",
    title: "Ясность каждого шага",
    text: teachersValues[1],
  },
  {
    index: "03",
    title: "Постоянное развитие",
    text: teachersValues[2],
  },
  {
    index: "04",
    title: "Комфортный путь",
    text: teachersValues[3],
  },
];

export default function TeachersPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>INSIDE · Тюмень</p>
          <h1 className={pages.pageTitle}>Преподаватели</h1>
          <p className={pages.pageLead}>{teachersIntro.lead}</p>
          <div className={styles.stats} aria-label="Ключевые факты">
            {stats.map((item) => (
              <div key={item.value} className={styles.stat}>
                <span className={styles.statValue}>{item.value}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </header>

        <div className={styles.introGrid}>
          <div className={styles.introImageWrap}>
            <img
              src={teachersIntro.heroImage}
              alt="Александр и Ольга — основатели студии INSIDE"
              width={1128}
              height={768}
              className={styles.introImage}
            />
            <p className={styles.introCaption}>Саша и Оля — основатели INSIDE</p>
          </div>
          <div className={styles.introCopy}>
            <p>
              Мы начинали так же, как вы: будучи уже взрослыми и с нуля. Сегодня ведём группы,
              готовим к вечеринкам и соревнованиям — и делаем путь в хастл понятным с первого
              занятия.
            </p>
          </div>
        </div>

        <section className={styles.philosophySection} aria-labelledby="philosophy-heading">
          <h2 id="philosophy-heading" className={styles.philosophyHeading}>
            Как мы учим
          </h2>
          <div className={styles.philosophyGrid}>
            {philosophy.map((item) => (
              <article key={item.index} className={styles.philosophyCard}>
                <span className={styles.philosophyIndex} aria-hidden="true">
                  {item.index}
                </span>
                <h3 className={styles.philosophyTitle}>{item.title}</h3>
                <p className={styles.philosophyText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.teamSection} aria-labelledby="team-heading">
          <h2 id="team-heading" className={styles.teamHeading}>
            Команда
          </h2>
          <p className={styles.teamLead}>
            Два основателя — одна методика: системно, прозрачно и с вниманием к деталям.
          </p>
          <div className={styles.teamGrid}>
            {teachers.map((person) => (
              <article key={person.id} className={styles.teacherCard}>
                <div className={styles.teacherPhoto}>
                  <img
                    src={person.image}
                    alt={person.name}
                    width={640}
                    height={960}
                    loading="lazy"
                  />
                </div>
                <div className={styles.teacherBody}>
                  <p className={styles.teacherRole}>{person.role}</p>
                  <h3 className={styles.teacherName}>{person.name}</h3>
                  <ul className={styles.teacherBio}>
                    {person.bio.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <blockquote className={styles.outroBlock}>
          <p>{teachersOutro}</p>
        </blockquote>

        <div className={styles.ctaBand}>
          <div className={styles.ctaCopy}>
            <strong>Приходи и убедись в этом сам</strong>
            <p>
            Запишись на пробное занятие. Это бесплатно и ни к чему не обязывает. Если не понравится — ты ничего не потеряешь.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
            <Link
              className={`${pages.btn} ${pages.btnGhost}`}
              href="https://vk.me/inside_dance72"
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать в VK
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
