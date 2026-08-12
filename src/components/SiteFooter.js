import Link from "next/link";
import { siteContacts } from "@/lib/site-contacts";
import layout from "@/styles/layout.module.scss";

export function SiteFooter() {
  return (
    <footer className={layout.footer}>
      <div className={layout.footerInner}>
        <div>
          <p className={layout.footerTitle}>Аренда зала</p>
          <p className={layout.footerBrand}>
            INSIDE — танцевальные залы в центре Тюмени. Смотрите занятость и оставляйте заявку
            онлайн.
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
            <Link href="/#contacts">Как добраться</Link>
          </div>
        </div>
        <div>
          <p className={layout.footerTitle}>Разделы</p>
          <div className={layout.footerLinks}>
            <Link href="/#rental">Аренда и календарь</Link>
            <Link href="/#photos">Фотографии зала</Link>
            <Link href="/#contacts">Как добраться</Link>
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
        <span>© {new Date().getFullYear()} INSIDE. Все права защищены.</span>
        <Link href="/admin/login" className={layout.footerAdminLink}>
          Вход для администратора
        </Link>
      </div>
    </footer>
  );
}
