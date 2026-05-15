"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import logoImage from "../../public/logo.jpg";
import layout from "@/styles/layout.module.scss";

const links = [
  { href: "/", label: "Главная" },
  { href: "/news", label: "Новости" },
  { href: "/gallery", label: "Фотографии" },
  { href: "/achievements", label: "Достижения" },
  { href: "/about", label: "О нас" },
  { href: "/#trial", label: "Пробное" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <Link href="/" className={layout.logo}>
            <img
              src={logoImage.src}
              alt="Inside — студия танца"
              width={48}
              height={48}
              className={layout.logoImage}
            />
          </Link>
          <nav className={layout.nav} aria-label="Основная навигация">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className={`${layout.burger} ${open ? layout.burgerOpen : ""}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Меню</span>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <div
        id="mobile-menu"
        className={`${layout.mobileNav} ${open ? layout.mobileNavOpen : ""}`}
        aria-hidden={!open}
      >
        <div className={layout.mobileNavInner}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
