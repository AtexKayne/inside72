"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import pages from "@/styles/pages.module.scss";
import {
  BUSY_LABEL,
  addDays,
  eventBlockStyle,
  eventsForDay,
  mergeNearbyDayEvents,
  formatDayHeader,
  formatSlotTime,
  formatTimeShort,
  formatWeekRange,
  getHallSlots,
  getWeekDays,
  isSlotBusy,
  isSlotIndexPast,
  isSlotRangeFree,
  slotEndFromIndex,
  slotRangeWithMinRental,
  slotRangeBlockStyle,
  slotRangeBounds,
  slotStartFromIndex,
  startOfWeekMonday,
  ymdInTz,
} from "@/lib/hall-calendar";
import { DEFAULT_HALL_ID, getHallById, HALLS, isHallComingSoon } from "@/lib/halls";
import { HallBookingForm } from "@/components/HallBookingForm";
import styles from "./hall-rental-calendar.module.scss";

const SLOTS = getHallSlots();
const GESTURE_THRESHOLD_PX = 8;
const CALENDAR_GUIDE_STORAGE_KEY = "inside-hall-calendar-guide-v1";
const GUIDE_SPOTLIGHT_PADDING_PX = 10;

function isSameWeek(a, b) {
  return ymdInTz(startOfWeekMonday(a)) === ymdInTz(startOfWeekMonday(b));
}

function getGuideRectRelative(el, containerEl) {
  const containerRect = containerEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - containerRect.top,
    left: rect.left - containerRect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getGuideSpotlightRect(highlightEl, containerEl) {
  const rect = getGuideRectRelative(highlightEl, containerEl);
  return {
    top: rect.top - GUIDE_SPOTLIGHT_PADDING_PX,
    left: rect.left - GUIDE_SPOTLIGHT_PADDING_PX,
    width: rect.width + GUIDE_SPOTLIGHT_PADDING_PX * 2,
    height: rect.height + GUIDE_SPOTLIGHT_PADDING_PX * 2,
  };
}

function slotAtPointer(dayGridEl, clientY) {
  const rect = dayGridEl.getBoundingClientRect();
  if (clientY < rect.top || clientY >= rect.bottom) return null;
  const index = Math.floor(((clientY - rect.top) / rect.height) * SLOTS.length);
  return SLOTS[Math.max(0, Math.min(SLOTS.length - 1, index))]?.index ?? null;
}

export function HallRentalCalendar({ compact = false }) {
  const [activeHallId, setActiveHallId] = useState(DEFAULT_HALL_ID);
  const activeHall = getHallById(activeHallId);
  const [mounted, setMounted] = useState(false);
  const [weekStart, setWeekStart] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [noSource, setNoSource] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [dragSelect, setDragSelect] = useState(null);
  const [selectionError, setSelectionError] = useState(null);
  const dragSelectRef = useRef(null);
  const pendingPointerRef = useRef(null);
  const eventsRef = useRef(events);
  const calendarSectionRef = useRef(null);
  const calendarHeaderRef = useRef(null);
  const calendarHighlightRef = useRef(null);
  const guideDismissRef = useRef(null);
  const [showCalendarGuide, setShowCalendarGuide] = useState(false);
  const [guideSpotlightRect, setGuideSpotlightRect] = useState(null);
  const [guidePanelTop, setGuidePanelTop] = useState(0);

  const calendarReady = weekStart !== null;
  const weekDays = useMemo(() => (weekStart ? getWeekDays(weekStart) : []), [weekStart]);
  const weekLabel = useMemo(() => (weekStart ? formatWeekRange(weekStart) : ""), [weekStart]);
  const isCurrentWeek = weekStart ? isSameWeek(weekStart, new Date()) : true;

  useEffect(() => {
    setWeekStart(startOfWeekMonday(new Date()));
    setMounted(true);
  }, []);

  const loadEvents = useCallback(async (start, hallId) => {
    setLoading(true);
    setLoadError(false);

    const from = start.toISOString();
    const to = addDays(start, 7).toISOString();

    try {
      const res = await fetch(
        `/api/hall-calendar?hall=${encodeURIComponent(hallId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
      setNoSource(!data.source);
    } catch {
      setEvents([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!weekStart) return;
    loadEvents(weekStart, activeHallId);
  }, [weekStart, activeHallId, loadEvents]);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = Boolean(localStorage.getItem(CALENDAR_GUIDE_STORAGE_KEY));
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const el = calendarSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        const highlight = calendarHighlightRef.current;
        const container = calendarSectionRef.current;
        if (!highlight || !container) return;
        setGuideSpotlightRect(getGuideSpotlightRect(highlight, container));
        setShowCalendarGuide(true);
        observer.disconnect();
      },
      { threshold: 1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!showCalendarGuide) return;

    function updateGuideLayout() {
      const highlight = calendarHighlightRef.current;
      const container = calendarSectionRef.current;
      const header = calendarHeaderRef.current;
      if (highlight && container) {
        setGuideSpotlightRect(getGuideSpotlightRect(highlight, container));
      }
      if (header) {
        setGuidePanelTop(header.offsetHeight + 8);
      }
    }

    updateGuideLayout();
    window.addEventListener("resize", updateGuideLayout);
    return () => window.removeEventListener("resize", updateGuideLayout);
  }, [showCalendarGuide, loading, weekStart, activeHallId]);

  useEffect(() => {
    if (!showCalendarGuide) return;
    guideDismissRef.current?.focus({ preventScroll: true });
  }, [showCalendarGuide]);

  const dismissCalendarGuide = useCallback(() => {
    try {
      localStorage.setItem(CALENDAR_GUIDE_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowCalendarGuide(false);
    setGuideSpotlightRect(null);
  }, []);

  useEffect(() => {
    if (!showCalendarGuide) return;
    function onKeyDown(e) {
      if (e.key === "Escape") dismissCalendarGuide();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCalendarGuide, dismissCalendarGuide]);

  function switchHall(hallId) {
    if (hallId === activeHallId) return;
    setActiveHallId(hallId);
    setBookingSlot(null);
    setDragSelect(null);
    setSelectionError(null);
  }

  useEffect(() => {
    dragSelectRef.current = dragSelect;
  }, [dragSelect]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const commitRange = useCallback(
    (ymd, slotA, slotB) => {
      const range = slotRangeWithMinRental(ymd, slotA, slotB, events);
      if (!range.ok) {
        setSelectionError(range.reason);
        return false;
      }
      setBookingSlot({
        start: slotStartFromIndex(ymd, range.from),
        end: slotEndFromIndex(ymd, range.to),
      });
      setSelectionError(null);
      return true;
    },
    [events],
  );

  useEffect(() => {
    if (!selectionError) return;
    const t = window.setTimeout(() => setSelectionError(false), 4000);
    return () => window.clearTimeout(t);
  }, [selectionError]);

  function goPrevWeek() {
    setDragSelect(null);
    setBookingSlot(null);
    setWeekStart((w) => addDays(w, -7));
  }

  function goNextWeek() {
    setDragSelect(null);
    setBookingSlot(null);
    setWeekStart((w) => addDays(w, 7));
  }

  function goToday() {
    setDragSelect(null);
    setBookingSlot(null);
    setWeekStart(startOfWeekMonday(new Date()));
  }

  function isSlotFree(ymd, slotIndex) {
    if (isSlotIndexPast(ymd, slotIndex)) return false;
    const slotStart = slotStartFromIndex(ymd, slotIndex);
    const slotEnd = slotEndFromIndex(ymd, slotIndex);
    return !isSlotBusy(events, slotStart, slotEnd);
  }

  function handleDayPointerDown(e, ymd) {
    if (loading || e.button !== 0) return;
    const el = e.currentTarget;
    const slotIndex = slotAtPointer(el, e.clientY);
    if (slotIndex == null || !isSlotFree(ymd, slotIndex)) return;

    const state = {
      ymd,
      anchorSlot: slotIndex,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      el,
      mode: null,
    };
    pendingPointerRef.current = state;

    function cleanup() {
      pendingPointerRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (el.hasPointerCapture(state.pointerId)) {
        try {
          el.releasePointerCapture(state.pointerId);
        } catch {
          /* ignore */
        }
      }
    }

    function onPointerMove(ev) {
      if (ev.pointerId !== state.pointerId) return;
      const dx = Math.abs(ev.clientX - state.startX);
      const dy = Math.abs(ev.clientY - state.startY);

      if (!state.mode) {
        if (dx < GESTURE_THRESHOLD_PX && dy < GESTURE_THRESHOLD_PX) return;
        if (dx > dy) {
          state.mode = "scroll";
          cleanup();
          return;
        }
        state.mode = "select";
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        setBookingSlot(null);
        setSelectionError(null);
        setDragSelect({ ymd: state.ymd, anchorSlot: state.anchorSlot, focusSlot: state.anchorSlot });
      }

      if (state.mode !== "select") return;
      ev.preventDefault();
      const nextSlot = slotAtPointer(el, ev.clientY);
      if (nextSlot == null) return;
      const sel = dragSelectRef.current;
      if (!sel || sel.ymd !== state.ymd) return;
      if (sel.focusSlot === nextSlot) return;
      if (!isSlotRangeFree(eventsRef.current, state.ymd, sel.anchorSlot, nextSlot)) return;
      setDragSelect({ ...sel, focusSlot: nextSlot });
    }

    function onPointerUp(ev) {
      if (ev.pointerId !== state.pointerId) return;
      if (state.mode === "select") {
        const sel = dragSelectRef.current;
        if (sel) {
          commitRange(sel.ymd, sel.anchorSlot, sel.focusSlot);
        }
        setDragSelect(null);
      } else if (!state.mode) {
        commitRange(state.ymd, state.anchorSlot, state.anchorSlot);
      }
      cleanup();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function getSelectionPreview(ymd) {
    const sel = dragSelect;
    if (!sel || sel.ymd !== ymd) return null;
    const range = slotRangeWithMinRental(ymd, sel.anchorSlot, sel.focusSlot, events);
    if (!range.ok) {
      const { from, to } = slotRangeBounds(sel.anchorSlot, sel.focusSlot);
      return { from, to, valid: false, reason: range.reason };
    }
    return { from: range.from, to: range.to, valid: true, reason: null };
  }

  return (
    <div
      ref={calendarSectionRef}
      className={`${styles.wrap} ${compact ? styles.wrapCompact : ""} ${showCalendarGuide ? styles.wrapGuideActive : ""}`}
    >
      <div ref={calendarHeaderRef} className={styles.calendarHeader}>
        <div className={styles.hallTabs} role="tablist" aria-label="Выбор зала">
          {HALLS.map((hall) => {
            const comingSoon = mounted && isHallComingSoon(hall);
            return (
              <button
                key={hall.id}
                type="button"
                role="tab"
                disabled={comingSoon}
                aria-selected={activeHallId === hall.id}
                className={`${styles.hallTab} ${activeHallId === hall.id ? styles.hallTabActive : ""}`}
                onClick={() => switchHall(hall.id)}
                title={comingSoon ? "Запись во 2-й зал — с 1 июня" : undefined}
              >
                <span className={styles.hallTabLabel}>{hall.label}</span>
                {comingSoon ? (
                  <span className={styles.hallTabBadge}>с 1 июня</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarStart}>
            {calendarReady ? <p className={styles.weekLabel}>{weekLabel}</p> : null}
            {calendarReady && !isCurrentWeek ? (
              <button type="button" className={styles.todayBtn} onClick={goToday}>
                Сегодня
              </button>
            ) : null}
          </div>
          <div className={styles.toolbarNav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goPrevWeek}
              disabled={!calendarReady}
              aria-label="Предыдущая неделя"
            >
              <CalendarNavIcon direction="prev" className={styles.navIcon} />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goNextWeek}
              disabled={!calendarReady}
              aria-label="Следующая неделя"
            >
              <CalendarNavIcon direction="next" className={styles.navIcon} />
            </button>
          </div>
        </div>
      </div>

      {selectionError === "past" ? (
        <p className={styles.alert} role="alert">
          Нельзя записаться на прошедшее время. Выберите будущий интервал.
        </p>
      ) : null}
      {selectionError === "busy" ? (
        <p className={styles.alert} role="alert">
          В выбранном интервале есть занятое время. Выберите только свободные слоты подряд.
        </p>
      ) : null}
      {selectionError === "min_duration" ? (
        <p className={styles.alert} role="alert">
          Минимальная аренда — 1 час. Рядом нет двух свободных получасовых слотов подряд.
        </p>
      ) : null}

      {loadError ? (
        <p className={styles.alert} role="alert">
          Не удалось загрузить расписание. Попробуйте обновить страницу или свяжитесь с администратором.
        </p>
      ) : null}

      {noSource && !loading && !loadError ? (
        <p className={styles.alertMuted}>
          Календарь пока недоступен для синхронизации — свободные слоты отображаются по умолчанию. Для записи
          выделите свободное время или напишите в студию.
        </p>
      ) : null}

      <div ref={calendarHighlightRef} className={styles.calendarScroll}>
        <div
          className={styles.calendar}
          aria-label={`Недельное расписание — ${activeHall.label}`}
          data-loading={!calendarReady || loading || undefined}
          data-selecting={dragSelect ? true : undefined}
        >
          {calendarReady ? (
          <>
          <div className={styles.headerRow}>
            <div className={styles.cornerCell} />
            {weekDays.map((day) => {
              const ymd = ymdInTz(day);
              const isToday = ymd === ymdInTz(new Date());
              return (
                <div
                  key={ymd}
                  className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ""}`}
                >
                  {formatDayHeader(day)}
                </div>
              );
            })}
          </div>

          <div className={styles.bodyRow}>
            <div className={styles.timeColumn}>
              {SLOTS.filter((slot) => slot.minute === 0).map((slot) => (
                <div
                  key={slot.index}
                  className={styles.timeLabel}
                  style={{ gridRow: `${slot.index + 1} / span 2` }}
                >
                  {formatSlotTime(slot.hour, 0)}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const ymd = ymdInTz(day);
              const dayEvents = mergeNearbyDayEvents(eventsForDay(events, ymd));
              const preview = getSelectionPreview(ymd);

              return (
                <div
                  key={ymd}
                  className={styles.dayColumn}
                  onPointerDown={(e) => handleDayPointerDown(e, ymd)}
                >
                  <div className={styles.dayGrid}>
                    {SLOTS.map((slot) => {
                      const past = isSlotIndexPast(ymd, slot.index);
                      const busy = past || !isSlotFree(ymd, slot.index);
                      const inPreview =
                        preview &&
                        !busy &&
                        slot.index >= preview.from &&
                        slot.index <= preview.to;
                      const slotClass = busy
                        ? styles.slotBusy
                        : inPreview
                          ? preview.valid
                            ? styles.slotSelected
                            : styles.slotSelectedInvalid
                          : styles.slotFree;

                      return (
                        <div
                          key={slot.index}
                          role="button"
                          tabIndex={busy || loading ? -1 : 0}
                          className={`${styles.slot} ${slotClass}`}
                          style={{ gridRow: slot.index + 1 }}
                          aria-disabled={busy || loading}
                          aria-label={
                            past
                              ? `${formatDayHeader(day)}, ${formatSlotTime(slot.hour, slot.minute)} — прошедшее время`
                              : busy
                                ? `${formatDayHeader(day)}, ${formatSlotTime(slot.hour, slot.minute)} — ${BUSY_LABEL}`
                                : `${formatDayHeader(day)}, ${formatSlotTime(slot.hour, slot.minute)} — выбрать`
                          }
                        />
                      );
                    })}
                  </div>

                  <div className={styles.eventsLayer} aria-hidden={dayEvents.length === 0 && !preview}>
                    {dayEvents.map((event) => {
                      const blockStyle = eventBlockStyle(event.start, event.end);
                      return (
                        <div
                          key={`${event.start.toISOString()}-${event.end.toISOString()}`}
                          className={styles.busyBlock}
                          style={blockStyle}
                          title={`${BUSY_LABEL} ${formatTimeShort(event.start)}–${formatTimeShort(event.end)}`}
                        >
                          <span className={styles.busyBlockLabel}>{BUSY_LABEL}</span>
                          <span className={styles.busyBlockTime}>
                            {formatTimeShort(event.start)}–{formatTimeShort(event.end)}
                          </span>
                        </div>
                      );
                    })}
                    {preview ? (
                      <div
                        className={
                          preview.valid ? styles.selectionBlock : styles.selectionBlockInvalid
                        }
                        style={slotRangeBlockStyle(preview.from, preview.to)}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          </>
          ) : null}
        </div>
      </div>

      {!calendarReady || loading ? <p className={styles.loading}>Загрузка расписания…</p> : null}

      {showCalendarGuide && guideSpotlightRect
        ? createPortal(<div className={styles.guideBackdrop} aria-hidden />, document.body)
        : null}

      {showCalendarGuide && guideSpotlightRect ? (
        <div
          className={styles.guideOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hall-calendar-guide-title"
        >
          <div
            className={styles.guideSpotlight}
            style={{
              top: guideSpotlightRect.top,
              left: guideSpotlightRect.left,
              width: guideSpotlightRect.width,
              height: guideSpotlightRect.height,
            }}
            aria-hidden
          />
          <div className={styles.guidePanel} style={{ top: guidePanelTop }}>
            <h3 id="hall-calendar-guide-title" className={styles.guideTitle}>
              Как записаться по календарю
            </h3>
            <div className={styles.guideLegend} aria-label="Обозначения цветов в календаре">
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchFree}`} />
                Свободно
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchBusy}`} />
                {BUSY_LABEL}
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchSelected}`} />
                Выбранный интервал
              </span>
            </div>
            <ul className={styles.guideList}>
              <li>
                Выделите свободный интервал от 1 часа (шаг 30 минут): зажмите и проведите по слотам в одном дне или
                нажмите на слот — подставится соседний свободный часовой интервал.
              </li>
              <li>После выбора откроется форма заявки.</li>
              <li className={styles.guideListMobile}>
                На телефоне смахните календарь влево‑вправо, чтобы увидеть все дни недели.
              </li>
            </ul>
            <button
              ref={guideDismissRef}
              type="button"
              className={pages.btn}
              onClick={dismissCalendarGuide}
            >
              Понятно
            </button>
          </div>
        </div>
      ) : null}

      {bookingSlot ? (
        <HallBookingForm
          hallId={activeHall.id}
          hallLabel={activeHall.label}
          slotStart={bookingSlot.start}
          slotEnd={bookingSlot.end}
          onClose={() => setBookingSlot(null)}
        />
      ) : null}
    </div>
  );
}

function CalendarNavIcon({ direction, className }) {
  const isPrev = direction === "prev";

  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={isPrev ? "M12 4L6 10l6 6M17 4l-6 6 6 6" : "M8 4l6 6-6 6M3 4l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
