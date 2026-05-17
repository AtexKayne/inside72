import Link from "next/link";
import { TrialCta } from "@/components/TrialCta";
import {
  teachers,
  teachersIntro,
  teachersOutro,
  teachersValues,
} from "@/lib/teachers";
import pages from "@/styles/pages.module.scss";

export const metadata = {
  title: "Преподаватели",
  description:
    "Основатели студии Inside — Александр Резчиков и Ольга Иванова. Хастл с нуля, системное обучение и опыт преподавания.",
  alternates: { canonical: "/teachers" },
};

export default function TeachersPage() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <header className={pages.pageHero}>
          <p className={pages.pageKicker}>Студия Inside</p>
          <h1 className={pages.pageTitle}>Преподаватели</h1>
          <p className={pages.pageLead}>{teachersIntro.lead}</p>
        </header>

        <div className={pages.teachersHero}>
          <img
            src={teachersIntro.heroImage}
            alt="Александр и Ольга — основатели студии Inside"
            width={1128}
            height={768}
            className={pages.teachersHeroImage}
          />
        </div>

        <div className={pages.teachersValues}>
          {teachersValues.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <div className={pages.teachersGrid}>
          {teachers.map((person) => (
            <article key={person.id} className={pages.teacherCard}>
              <div className={pages.teacherPhoto}>
                <img
                  src={person.image}
                  alt={person.name}
                  width={640}
                  height={960}
                  loading="lazy"
                />
              </div>
              <div className={pages.teacherBody}>
                <p className={pages.teacherRole}>{person.role}</p>
                <h2 className={pages.teacherName}>{person.name}</h2>
                <ul className={pages.teacherBio}>
                  {person.bio.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className={pages.teachersOutro}>{teachersOutro}</p>

        <div className={pages.ctaRow} style={{ marginTop: "2.5rem" }}>
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
    </section>
  );
}
