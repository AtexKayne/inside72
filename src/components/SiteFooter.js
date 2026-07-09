import Link from "next/link";
import { TrialCtaLink } from "@/components/TrialCtaLink";
import { siteContacts } from "@/lib/site-contacts";
import layout from "@/styles/layout.module.scss";

export function SiteFooter() {
  return (
    <footer className={layout.footer}>
      <div className={layout.footerInner}>
        <div>
          <p className={layout.footerTitle}>Студия</p>
          <p className={layout.footerBrand}>
            Inside — студия социального хастла в Тюмени. С нуля, с опытными преподавателями и
            дружным сообществом на танцполе.
          </p>
        </div>
        <div>
          <p className={layout.footerTitle}>Контакты</p>
          <div className={layout.footerLinks}>
            <a href={`tel:${siteContacts.phone.tel}`}>{siteContacts.phone.display}</a>
            <span className={layout.footerMeta}>{siteContacts.address.line}</span>
            <span className={layout.footerMeta}>{siteContacts.hours}</span>
            <a href={siteContacts.vk.url} target="_blank" rel="noopener noreferrer">
              ВКонтакте
            </a>
            <Link href="/about#contacts">Как нас найти</Link>
          </div>
        </div>
        <div>
          <p className={layout.footerTitle}>Разделы</p>
          <div className={layout.footerLinks}>
            <Link href="/prices">Цены и акции</Link>
            <Link href="/news">Новости</Link>
            <Link href="/gallery">Фотографии</Link>
            <Link href="/teachers">Преподаватели</Link>
            <Link href="/arenda">Аренда зала</Link>
            <Link href="/about">О нас</Link>
          </div>
        </div>
        <div>
          <p className={layout.footerTitle}>Документы</p>
          <div className={layout.footerLinks}>
            <Link href="/privacy">Политика персональных данных</Link>
          </div>
        </div>
      </div>
      <div className={layout.footerBottom}>
        <span>© {new Date().getFullYear()} Inside. Все права защищены.</span>
        <Link href="/admin/login" className={layout.footerAdminLink}>
          Вход для администратора
        </Link>
      </div>
    </footer>
  );
}
