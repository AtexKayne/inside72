"use client";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import {
  COVER_SWEEP_MAX,
  describeArc,
  easeOutCubic,
  LOADER_CYCLE_MS,
  loaderSweepForCycle,
} from "@/lib/page-transition-arc";
import { scrollToHash } from "@/lib/scroll-to-hash";
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
  const arcRef = useRef(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const url = new URL(href, window.location.origin);

      if (url.pathname === pathname && url.hash) {
        e.preventDefault();
        scrollToHash(url.hash);
        window.history.pushState(null, "", url.pathname + url.search + url.hash);
        return;
      }

      if (!isInternalNavLink(anchor, pathname)) return;

      e.preventDefault();
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

    const href = pendingHref.current;
    if (!href) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const url = new URL(href, window.location.origin);
    if (url.hash) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!scrollToHash(url.hash, "instant")) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }
        });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [phase]);

  useEffect(() => {
    if (phase !== "idle") return;
    if (pathname?.startsWith("/admin")) return;

    const hash = window.location.hash;
    if (!hash) return;

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToHash(hash, "instant"));
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "revealing") return;

    const timer = window.setTimeout(() => {
      setPhase("idle");
      busy.current = false;
      pendingHref.current = null;
    }, REVEAL_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

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

  // Cover: arc 0→360; covered: empty→fill loop (one rAF, no phase gap).
  useEffect(() => {
    if (phase !== "covering") return;

    const arc = arcRef.current;
    if (!arc) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      arc.setAttribute("d", describeArc(COVER_SWEEP_MAX));
      return;
    }

    arc.setAttribute("d", describeArc(0));

    let raf = 0;
    const sessionStart = performance.now();

    const tick = (now) => {
      const p = phaseRef.current;
      if (p === "idle" || p === "revealing") return;

      const elapsed = now - sessionStart;

      if (p === "covering") {
        const t = Math.min(elapsed / COVER_MS, 1);
        arc.setAttribute("d", describeArc(COVER_SWEEP_MAX * easeOutCubic(t)));
      } else if (p === "covered") {
        const loaderElapsed = elapsed - COVER_MS;
        const t = (loaderElapsed % LOADER_CYCLE_MS) / LOADER_CYCLE_MS;
        arc.setAttribute("d", describeArc(loaderSweepForCycle(t)));
      }

      if (p === "covering" || p === "covered") {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;
    const arc = arcRef.current;
    if (arc) arc.setAttribute("d", describeArc(COVER_SWEEP_MAX));
  }, [phase]);

  useEffect(() => {
    if (phase !== "covering") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) return;

    const href = pendingHref.current;
    if (href) {
      router.push(href, { scroll: false });
      const url = new URL(href, window.location.origin);
      if (url.hash) {
        requestAnimationFrame(() => scrollToHash(url.hash, "instant"));
      }
    }
    busy.current = false;
    pendingHref.current = null;
    setPhase("idle");
  }, [phase, router]);

  if (pathname?.startsWith("/admin")) return null;

  const active = phase !== "idle";
  const showArc = active;

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
        <span className={`${styles.line} ${styles.lineLeft}`} aria-hidden />
        <span className={`${styles.line} ${styles.lineRight}`} aria-hidden />
        <svg className={styles.circleSvg} viewBox="0 0 100 100" aria-hidden>
          {showArc && (
            <path ref={arcRef} className={styles.arc} d={describeArc(0)} />
          )}
        </svg>
      </div>
    </div>
  );
}
