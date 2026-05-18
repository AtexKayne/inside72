import { AboutYandexMap } from "@/components/AboutYandexMap";
import { siteContacts } from "@/lib/site-contacts";
import styles from "./site-contacts.module.scss";

export function SiteContacts() {
  const { address, phone, hours, vk } = siteContacts;

  return (
    <section id="contacts" className={styles.section} aria-labelledby="contacts-heading">
      <header className={styles.header}>
        <p className={styles.kicker}>Контакты</p>
        <h2 id="contacts-heading" className={styles.title}>
          Как нас найти
        </h2>
        <p className={styles.lead}>
          Мы в центре Тюмени — от ЦУМа до нас 200 метров. Заходите с ул. Герцена.
        </p>
      </header>

      <div className={styles.layout}>
        <AboutYandexMap embedded />

        <div className={styles.sidebar}>
          <div className={styles.cards}>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Адрес</p>
              <p className={styles.cardValue}>
                {address.line}
                <br />
                Заходите с ул. Герцена — код калитки {address.gateCode}.
              </p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Часы работы</p>
              <p className={styles.cardValue}>{hours}</p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Телефон</p>
              <p className={styles.cardValue}>
                <a className={styles.phoneLink} href={`tel:${phone.tel}`}>
                  {phone.display}
                </a>{" "}
                ({phone.contact})
              </p>
            </article>
            <article className={styles.card}>
              <p className={styles.cardLabel}>Соцсети</p>
              <p className={styles.cardValue}>
                <a href={vk.url} target="_blank" rel="noopener noreferrer">
                  {vk.label}
                </a>
              </p>
            </article>
          </div>

          <div className={styles.parking}>
            <p>
              Припарковаться легко на ул. Герцена (после 18:00 парковка бесплатная) или заезжая с
              другой стороны — на ул. Достоевского.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.note} role="note">
          Обратите внимание! К нам можно зайти только с улицы Герцена. С другой стороны здание
          ограждено воротами.
        </p>
        <p className={styles.help}>
          Непременно звоните, если чувствуете, что теряетесь — мы поможем найтись:{" "}
          <a className={styles.phoneLink} href={`tel:${phone.tel}`}>
            {phone.display}
          </a>{" "}
          ({phone.contact}).
        </p>
      </div>
    </section>
  );
}
