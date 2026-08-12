"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MOBILE_MENU_EXIT_MS, useModalTransition } from "@/hooks/useModalTransition";
import layout from "@/styles/layout.module.scss";

const links = [
  { href: "/#rental", label: "Аренда", hash: "rental" },
  { href: "/#photos", label: "Фото", hash: "photos" },
  { href: "/#contacts", label: "Как добраться", hash: "contacts" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const { mounted, exiting, handleAnimationEnd } = useModalTransition(menuOpen, {
    exitAnimationName: "mobileMenuBackdropOut",
    exitMs: MOBILE_MENU_EXIT_MS,
  });

  const closeMenu = useCallback(() => {
    if (!menuOpen || exiting) return;
    setMenuOpen(false);
  }, [menuOpen, exiting]);

  useEffect(() => {
    if (!mounted || exiting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, exiting]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash.replace(/^#/, ""));
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  useEffect(() => {
    if (!mounted || exiting) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted, exiting, closeMenu]);

  return (
    <>
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <Link href="/" className={layout.logo} aria-label="Inside — аренда зала">
            INSIDE
          </Link>
          <nav className={layout.nav} aria-label="Основная навигация">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setActiveHash(l.hash)}
                aria-current={pathname === "/" && activeHash === l.hash ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
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
          <div className={layout.mobileNavMotif} aria-hidden>
            <div className={layout.mobileNavMotifFrame}>
              <span className={`${layout.mobileNavLine} ${layout.mobileNavLineLeft}`} />
              <span className={`${layout.mobileNavLine} ${layout.mobileNavLineRight}`} />
            </div>
          </div>
          <div className={layout.mobileNavInner}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => {
                  setActiveHash(l.hash);
                  closeMenu();
                }}
                aria-current={pathname === "/" && activeHash === l.hash ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
