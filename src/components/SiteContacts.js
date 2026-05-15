import { siteContacts } from "@/lib/site-contacts";
import pages from "@/styles/pages.module.scss";

export function SiteContacts({ showTitle = true }) {
  return (
    <div className={pages.contacts}>
      {showTitle ? (
        <h2 id="contacts-heading" className={pages.h2}>
          Как нас найти
        </h2>
      ) : null}

      <p className={pages.contactsLead}>
        Мы находимся в центре города, от ЦУМа до нас — 200 метров.
      </p>

      <dl className={pages.contactsMeta}>
        <div>
          <dt>Адрес</dt>
          <dd>
            {siteContacts.address.line}
            <br />
            Заходите с ул. Герцена — код калитки {siteContacts.address.gateCode}.
          </dd>
        </div>
        <div>
          <dt>Часы работы</dt>
          <dd>{siteContacts.hours}</dd>
        </div>
        <div>
          <dt>Телефон</dt>
          <dd>
            <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
            {" "}
            ({siteContacts.phone.contact})
          </dd>
        </div>
        <div>
          <dt>Соцсети</dt>
          <dd>
            <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
              {siteContacts.vk.label}
            </a>
          </dd>
        </div>
      </dl>

      <div className={pages.contactsBlock}>
        <p>
          Припарковаться легко на ул. Герцена (после 18:00 парковка бесплатная) или заезжая с
          другой стороны — на ул. Достоевского.
        </p>
      </div>

      <p className={pages.contactsNote} role="note">
        Обратите внимание! К нам можно зайти только с улицы Герцена. С другой стороны здание
        ограждено воротами.
      </p>

      <p className={pages.contactsHelp}>
        Непременно звоните, если чувствуете, что теряетесь — мы поможем найтись:{" "}
        <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a> (
        {siteContacts.phone.contact}).
      </p>
    </div>
  );
}
