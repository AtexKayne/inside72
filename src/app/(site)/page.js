import Link from "next/link";
import { HomeHeroSwiper } from "@/components/HomeHeroSwiper";
import { HomeLessonVideo } from "@/components/HomeLessonVideo";
import { SiteStories } from "@/components/SiteStories";
import { TrialCta } from "@/components/TrialCta";
import { getStories } from "@/lib/data-store";
import { pageMetadata, siteSeo } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import bannerImage from "../../../public/banner-tanec-vnutri.webp";
import bannerImageFallback from "../../../public/banner-tanec-vnutri.png";

export const revalidate = 30;

export const metadata = {
  ...pageMetadata({
    description:
      "Студия INSIDE в Тюмени — танцы для взрослых с нуля. Мы танцуем хастл, группы стартуют каждый месяц. Опытные преподаватели и дружное сообщество.",
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
              alt="INSIDE — социальный хастл: научись танцевать в паре с нуля"
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
            <h1 className={pages.pageTitle}>INSIDE — это стиль и эстетика парного танца</h1>
            <p className={pages.lead}>
            Мы танцуем хастл - парный танец, который легко освоить с нуля. Его танцуют как на набережных, так и под софитами сцены. Опыт не требуется, своя пара необязательна.
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

      <HomeLessonVideo />

      <section className={pages.section}>
        <div className={pages.inner}>
          <h2 className={pages.h2}>Почему хастл?</h2>
          <div className={pages.cardGrid}>
            <article className={pages.card}>
              <h3>Быстрый старт</h3>
              <p>
              Легко освоить с нуля и танцевать под любую музыку, в парке, баре или на танцполе. Пара не нужна: большинство учеников приходят одни.
              </p>
            </article>
            <article className={pages.card}>
              <h3>Преподы профи</h3>
              <p>
              Мы любим покопать вглубь, чтобы мозг работал, а тело училось. Любим делать танец удобным, красивым и безопасным. Мы горим своим делом, поэтому с нами научатся даже те, кто считает себя деревянным.
              </p>
            </article>
            <article className={pages.card}>
              <h3>Хобби и комьюнити</h3>
              <p>
              Танцевать прикольнее, чем после работы скролить ленту. А ещё на танцах есть другие люди, часто - разносторонние и интересные.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={pages.section}>
        <div className={pages.inner}>
          <h2 className={pages.h2}>Пробное занятие</h2>
          <p className={pages.lead} style={{ marginBottom: "1.5rem" }}>
          Первое занятие — знакомство со студией, преподавателями и атмосферой. Пара не нужна: оставь заявку, и мы подберём удобное время для урока.
          </p>
          <TrialCta className={pages.btn}>Записаться</TrialCta>
        </div>
      </section>
    </>
  );
}
