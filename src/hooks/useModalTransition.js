"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Keep in sync with $modal-exit-duration in styles/_modal-animation.scss */
export const MODAL_EXIT_MS = 300;

/** Keep in sync with $mobile-menu-exit-duration + backdrop delay in _mobile-menu-animation.scss */
export const MOBILE_MENU_EXIT_MS = 590;

/**
 * @param {boolean} isOpen
 * @param {{ exitAnimationName?: string; exitMs?: number }} [options]
 */
export function useModalTransition(isOpen, options = {}) {
  const { exitAnimationName = "modalBackdropOut", exitMs = MODAL_EXIT_MS } = options;
  const [mounted, setMounted] = useState(isOpen);
  const [exiting, setExiting] = useState(false);
  const afterCloseRef = useRef(null);
  const exitTimerRef = useRef(null);
  const prevIsOpenRef = useRef(isOpen);
  const exitingRef = useRef(false);

  useEffect(() => {
    exitingRef.current = exiting;
  }, [exiting]);

  const completeExit = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setMounted(false);
    setExiting(false);
    const fn = afterCloseRef.current;
    afterCloseRef.current = null;
    fn?.();
  }, []);

  const requestClose = useCallback(
    (onAfterClose) => {
      if (exitingRef.current) return;
      afterCloseRef.current = onAfterClose ?? null;
      setExiting(true);
      exitTimerRef.current = setTimeout(completeExit, exitMs);
    },
    [completeExit, exitMs],
  );

  const handleAnimationEnd = useCallback(
    (e) => {
      if (!exitingRef.current || e.animationName !== exitAnimationName) return;
      completeExit();
    },
    [completeExit, exitAnimationName],
  );

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      setMounted(true);
      setExiting(false);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      return;
    }

    if (!isOpen && wasOpen && mounted && !exitingRef.current) {
      requestClose();
    }
  }, [isOpen, mounted, requestClose]);

  useEffect(
    () => () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    },
    [],
  );

  return { mounted, exiting, requestClose, handleAnimationEnd };
}
