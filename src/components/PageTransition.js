"use client";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page-transition.module.scss";

const COVER_MS = 550;
const REVEAL_MS = 500;

/** @typedef {"idle" | "covering" | "covered" | "revealing"} Phase */

function isInternalNavLink(anchor, pathname) {
  if (anchor.target === "_blank") return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (href.startsWith("http") && !href.startsWith(window.location.origin)) return false;
  if (!href.startsWith("/")) return false;
  if (href.startsWith("/admin")) return false;

  const url = new URL(href, window.location.origin);
  if (url.pathname.startsWith("/admin")) return false;
  if (url.pathname === pathname && !url.hash) return false;

  return true;
}

export function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  /** @type {[Phase, React.Dispatch<React.SetStateAction<Phase>>]} */
  const [phase, setPhase] = useState("idle");
  const pendingHref = useRef(null);
  const busy = useRef(false);

  const startTransition = useCallback(
    (href) => {
      if (busy.current || !href || href === pathname) return;
      busy.current = true;
      pendingHref.current = href;
      setPhase("covering");
    },
    [pathname],
  );

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    function onClick(e) {
      if (busy.current) {
        e.preventDefault();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = e.target.closest("a");
      if (!anchor || !isInternalNavLink(anchor, pathname)) return;

      e.preventDefault();
      const url = new URL(anchor.getAttribute("href"), window.location.origin);
      startTransition(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startTransition]);

  useEffect(() => {
    if (phase !== "covering") return;

    const timer = window.setTimeout(() => {
      if (pendingHref.current) {
        router.push(pendingHref.current, { scroll: false });
      }
      setPhase("covered");
    }, COVER_MS);

    return () => window.clearTimeout(timer);
  }, [phase, router]);

  useEffect(() => {
    if (phase === "idle") return;
    lockScroll();
  }, [phase]);

  useEffect(() => () => unlockScroll(), []);

  useEffect(() => {
    if (phase !== "covered" || !pendingHref.current) return;

    const targetPath = new URL(pendingHref.current, window.location.origin).pathname;
    if (pathname !== targetPath) return;

    setPhase("revealing");
  }, [phase, pathname]);

  useEffect(() => {
    if (phase !== "revealing") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;

    const timer = window.setTimeout(() => {
      setPhase("idle");
      busy.current = false;
      pendingHref.current = null;
    }, REVEAL_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  // Unlock after the overlay is removed from the layout tree (next paint).
  useEffect(() => {
    if (phase !== "idle") return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => unlockScroll());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "covering") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) return;

    if (pendingHref.current) router.push(pendingHref.current, { scroll: false });
    busy.current = false;
    pendingHref.current = null;
    setPhase("idle");
  }, [phase, router]);

  if (pathname?.startsWith("/admin")) return null;

  const active = phase !== "idle";

  return (
    <div
      className={[
        styles.overlay,
        !active ? styles.overlayDone : "",
        active ? styles.overlayActive : "",
        phase === "covering" ? styles.covering : "",
        phase === "covered" ? styles.covered : "",
        phase === "covered" ? styles.loading : "",
        phase === "revealing" ? styles.revealing : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!active}
      aria-live="polite"
    >
      <div className={styles.motif}>
        <svg className={styles.circleSvg} viewBox="0 0 100 100" aria-hidden>
          <circle
            className={styles.circle}
            cx="50"
            cy="50"
            r="36.4"
            pathLength="1"
          />
        </svg>
      </div>
      <span className={`${styles.line} ${styles.lineLeft}`} aria-hidden />
      <span className={`${styles.line} ${styles.lineRight}`} aria-hidden />
    </div>
  );
}
