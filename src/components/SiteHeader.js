"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTrialModal } from "@/contexts/TrialModalContext";
import { useModalTransition } from "@/hooks/useModalTransition";
import layout from "@/styles/layout.module.scss";

const links = [
  { href: "/", label: "Главная" },
  { href: "/news", label: "Новости" },
  { href: "/gallery", label: "Фотографии" },
  { href: "/teachers", label: "Преподаватели" },
  { href: "/arenda", label: "Аренда зала" },
  { href: "/about", label: "О нас" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { open: trialOpen, openModal } = useTrialModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const { mounted, exiting, handleAnimationEnd } = useModalTransition(menuOpen);

  const closeMenu = useCallback(() => {
    if (!menuOpen || exiting) return;
    setMenuOpen(false);
  }, [menuOpen, exiting]);

  useEffect(() => {
    if (!mounted || trialOpen || exiting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, trialOpen, exiting]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted || exiting) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, exiting, closeMenu]);

  function openTrial() {
    setMenuOpen(false);
    openModal();
  }

  return (
    <>
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <Link href="/" className={layout.logo} aria-label="Inside — студия танца">
            INSIDE
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
            <button type="button" className={layout.navTrialBtn} onClick={openModal}>
              Пробное
            </button>
          </nav>
          <button
            type="button"
            className={`${layout.burger} ${menuOpen ? layout.burgerOpen : ""}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">Меню</span>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      {mounted ? (
        <div
          id="mobile-menu"
          className={`${layout.mobileNav} ${exiting ? layout.mobileNavExiting : ""}`}
          aria-hidden={exiting}
          onAnimationEnd={handleAnimationEnd}
          onClick={(e) => {
            if (e.target === e.currentTarget && !exiting) closeMenu();
          }}
        >
          <div
            className={`${layout.mobileNavInner} ${exiting ? layout.mobileNavInnerExiting : ""}`}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <button type="button" className={layout.mobileNavTrialBtn} onClick={openTrial}>
              Пробное
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
