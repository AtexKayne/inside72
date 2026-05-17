import Link from "next/link";
import { HomeHeroSwiper } from "@/components/HomeHeroSwiper";
import { SiteStories } from "@/components/SiteStories";
import { TrialCta } from "@/components/TrialCta";
import { getStories } from "@/lib/data-store";
import pages from "@/styles/pages.module.scss";
import bannerImage from "../../../public/banner-tanec-vnutri.png";

export const metadata = {
  title: "Главная",
  description:
    "Студия Inside — хастл с нуля и продолжающимся уровнем. Пробное занятие, расписание и атмосфера зала.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const stories = await getStories();

  return (
    <>
      <SiteStories items={stories} />

      <section className={pages.promoBanner} aria-label="Танец внутри">
        <div className={pages.inner}>
          <img
            src={bannerImage.src}
            alt="Танец внутри — научись танцевать в паре с нуля"
            width={1024}
            height={409}
            className={pages.promoBannerImage}
            fetchPriority="high"
          />
        </div>
      </section>

      <section className={pages.hero}>
        <div className={`${pages.inner} ${pages.heroGrid}`}>
          <div>
            <p className={pages.kicker}>Танцевальная студия</p>
            <h1 className={pages.title}>Inside — танец хастл</h1>
            <p className={pages.lead}>
              Парный социальный танец с акцентом на музыкальность, технику ведения и следования и
              уверенность на танцполе.
            </p>
            <div className={pages.ctaRow}>
              <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
              <Link className={`${pages.btn} ${pages.btnGhost}`} href="/about">
                О студии
              </Link>
            </div>
          </div>
          <HomeHeroSwiper />
        </div>
      </section>

      <section className={pages.section}>
        <div className={pages.inner}>
          <h2 className={pages.h2}>Направления</h2>
          <div className={pages.cardGrid}>
            <article className={pages.card}>
              <h3>Хастл</h3>
              <p>Базовые шаги, вращения, музыкальность и импровизация в паре.</p>
            </article>
            <article className={pages.card}>
              <h3>Группы</h3>
              <p>Комфортный состав, внимание преподавателя и ясная структура занятия.</p>
            </article>
            <article className={pages.card}>
              <h3>Сцена и социалы</h3>
              <p>Готовим к выступлениям и поддерживаем участие учеников в событиях.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={pages.section}>
        <div className={pages.inner}>
          <h2 className={pages.h2}>Пробное занятие</h2>
          <p className={pages.lead} style={{ marginBottom: "1.5rem" }}>
            Первое занятие — знакомство со студией, преподавателем и форматом. Оставьте заявку, и мы
            подберём удобное время.
          </p>
          <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
        </div>
      </section>
    </>
  );
}
