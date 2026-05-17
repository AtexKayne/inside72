import Link from "next/link";
import { siteContacts } from "@/lib/site-contacts";
import layout from "@/styles/layout.module.scss";

export function SiteFooter() {
  return (
    <footer className={layout.footer}>
      <div className={layout.footerInner}>
        <div>
          <p className={layout.footerTitle}>Студия</p>
          <p style={{ margin: 0, color: "#a3a3a3", maxWidth: "32ch" }}>
            Inside — танцевальная студия хастла. Чёрно-белая эстетика, внимание к технике и музыке.
          </p>
        </div>
        <div>
          <p className={layout.footerTitle}>Контакты</p>
          <div className={layout.footerLinks}>
            <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
            <span style={{ color: "#a3a3a3", fontSize: "0.95rem" }}>
              {siteContacts.address.line}
            </span>
            <span style={{ color: "#a3a3a3", fontSize: "0.95rem" }}>{siteContacts.hours}</span>
            <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
              ВКонтакте
            </a>
            <Link href="/about#contacts">Как нас найти</Link>
          </div>
        </div>
        <div>
          <p className={layout.footerTitle}>Разделы</p>
          <div className={layout.footerLinks}>
            <Link href="/news">Новости</Link>
            <Link href="/gallery">Фотографии</Link>
            <Link href="/teachers">Преподаватели</Link>
            <Link href="/arenda">Аренда зала</Link>
            <Link href="/about">О нас</Link>
            <Link href="/#trial">Запись на пробное</Link>
          </div>
        </div>
        <div>
          <p className={layout.footerTitle}>Документы</p>
          <div className={layout.footerLinks}>
            <Link href="/privacy">Политика персональных данных</Link>
            <Link href="/admin/login">Вход для администратора</Link>
          </div>
        </div>
      </div>
      <div className={layout.footerBottom}>© {new Date().getFullYear()} Inside. Все права защищены.</div>
    </footer>
  );
}
