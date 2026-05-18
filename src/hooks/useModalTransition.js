"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Keep in sync with $modal-exit-duration in styles/_modal-animation.scss */
export const MODAL_EXIT_MS = 300;

export function useModalTransition(isOpen) {
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
      exitTimerRef.current = setTimeout(completeExit, MODAL_EXIT_MS);
    },
    [completeExit],
  );

  const handleAnimationEnd = useCallback(
    (e) => {
      if (!exitingRef.current || e.animationName !== "modalBackdropOut") return;
      completeExit();
    },
    [completeExit],
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
