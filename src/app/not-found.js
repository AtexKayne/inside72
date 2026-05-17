import Link from "next/link";
import pages from "@/styles/pages.module.scss";

export default function NotFound() {
  return (
    <section className={pages.section}>
      <div className={pages.inner}>
        <h1 className={pages.pageTitle}>Страница не найдена</h1>
        <p className={pages.lead}>
          Возможно, ссылка устарела. Вернитесь на главную или в раздел новостей.
        </p>
        <p>
          <Link className={pages.btn} href="/">
            На главную
          </Link>
        </p>
      </div>
    </section>
  );
}
