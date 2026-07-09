import Link from "next/link";
import { HomeHeroSwiper } from "@/components/HomeHeroSwiper";
import { SiteStories } from "@/components/SiteStories";
import { TrialCta } from "@/components/TrialCta";
import { getStories } from "@/lib/data-store";
import { pageMetadata, siteSeo } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import bannerImage from "../../../public/banner-tanec-vnutri.webp";
import bannerImageFallback from "../../../public/banner-tanec-vnutri.png";

export const metadata = {
  ...pageMetadata({
    description:
      "Студия Inside в Тюмени — танцы для взрослых с нуля. Мы танцуем хастл, группы стартуют каждый месяц. Опытные преподаватели и дружное сообщество.",
    pathname: "/",
  }),
  title: { absolute: siteSeo.defaultTitle },
};

export default async function HomePage() {
  const stories = await getStories();

  return (
    <>
      <SiteStories items={stories} />

      <section className={pages.promoBanner} aria-label="Танец внутри">
        <div className={pages.inner}>
          <picture>
            <source srcSet={bannerImage.src} type="image/webp" />
            <img
              src={bannerImageFallback.src}
              alt="Inside — социальный хастл: научись танцевать в паре с нуля"
              width={2560}
              height={1023}
              className={pages.promoBannerImage}
              fetchPriority="high"
            />
          </picture>
        </div>
      </section>

      <section className={pages.hero}>
        <div className={`${pages.inner} ${pages.heroGrid}`}>
          <div>
            <p className={pages.kicker}>Танцевальная студия · Тюмень</p>
            <h1 className={pages.pageTitle}>Inside — социальный хастл</h1>
            <p className={pages.lead}>
              Парный танец, который легко освоить с нуля и танцевать под любую музыку — с разными
              партнёрами на вечеринках и опенах. Основатели студии Саша и Оля ведут группы по
              понятной системе: прозрачная методика, внимание к деталям и тусовка, где поддерживают
              друг друга.
            </p>
            <div className={pages.ctaRow}>
              <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
              <Link className={`${pages.btn} ${pages.btnGhost}`} href="/about">
                О студии
              </Link>
              <Link className={`${pages.btn} ${pages.btnGhost}`} href="/prices">
                Узнать цены
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
              <p>
                С нуля — под любую музыку, в парке, баре или на танцполе. Пара не нужна: большинство
                учеников приходят одни.
              </p>
            </article>
            <article className={pages.card}>
              <h3>Группы</h3>
              <p>
                Системное обучение от преподавателей с многолетним опытом: ясные шаги, детальные
                объяснения и комфортный темп.
              </p>
            </article>
            <article className={pages.card}>
              <h3>Сообщество</h3>
              <p>
                Тусовка, где поддерживают друг друга: социалы, опены и путь до соревнований — если
                захочешь.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={pages.section}>
        <div className={pages.inner}>
          <h2 className={pages.h2}>Пробное занятие</h2>
          <p className={pages.lead} style={{ marginBottom: "1.5rem" }}>
            Первое занятие — знакомство со студией, преподавателями и атмосферой. Пара не нужна:
            оставьте заявку, и мы подберём удобное время на открытый урок.
          </p>
          <TrialCta className={pages.btn}>Записаться на пробное</TrialCta>
        </div>
      </section>
    </>
  );
}
