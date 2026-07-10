import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import pages from "@/styles/pages.module.scss";
import styles from "./not-found.module.scss";

export const metadata = {
  ...pageMetadata({
    title: "Страница не найдена",
    description: "Запрошенная страница не существует. Вернитесь на главную студии INSIDE в Тюмени.",
    pathname: "/404",
    noIndex: true,
  }),
};

const quickLinks = [
  { href: "/about", label: "О студии", desc: "Адрес, контакты, как добраться" },
  { href: "/teachers", label: "Преподаватели", desc: "Саша и Оля — основатели INSIDE" },
  { href: "/news", label: "Новости", desc: "Наборы, события и мастер-классы" },
  { href: "/gallery", label: "Фотографии", desc: "Занятия и атмосфера студии" },
  { href: "/arenda", label: "Аренда зала", desc: "Почасовая аренда в центре Тюмени" },
];

function ArrowIcon() {
  return (
    <svg
      className={styles.linkArrow}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <section className={styles.section} aria-labelledby="not-found-title">
      <div className={styles.motif} aria-hidden="true">
        <span className={styles.motifLine} />
        <span className={styles.motifLine} />
      </div>

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={pages.pageKicker}>INSIDE · Тюмень</p>
          <p className={styles.code} aria-hidden="true">
            404
          </p>
          <h1 id="not-found-title" className={styles.title}>
            Страница не найдена
          </h1>
          <p className={styles.lead}>
            Возможно, ссылка устарела или страница была перенесена. Вернитесь на главную или
            выберите раздел ниже.
          </p>
          <div className={styles.ctaRow}>
            <Link className={pages.btn} href="/">
              На главную
            </Link>
            <Link className={`${pages.btn} ${pages.btnGhost}`} href="/news">
              Новости
            </Link>
          </div>
        </header>

        <div>
          <p className={styles.linksLabel} id="not-found-nav-label">
            Разделы сайта
          </p>
          <nav className={styles.linksGrid} aria-labelledby="not-found-nav-label">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.linkCard}>
                <span className={styles.linkTitle}>
                  {link.label}
                  <ArrowIcon />
                </span>
                <span className={styles.linkDesc}>{link.desc}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
