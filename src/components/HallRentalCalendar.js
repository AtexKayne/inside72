"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BUSY_LABEL,
  addDays,
  eventBlockStyle,
  eventsForDay,
  formatDayHeader,
  formatSlotTime,
  formatTimeShort,
  formatWeekRange,
  getHallSlots,
  getWeekDays,
  isSlotBusy,
  isSlotRangeFree,
  slotEndFromIndex,
  slotRangeWithMinRental,
  slotRangeBlockStyle,
  slotRangeBounds,
  slotStartFromIndex,
  startOfWeekMonday,
  ymdInTz,
} from "@/lib/hall-calendar";
import { DEFAULT_HALL_ID, getHallById, HALLS } from "@/lib/halls";
import { HallBookingForm } from "@/components/HallBookingForm";
import styles from "./hall-rental-calendar.module.scss";

const SLOTS = getHallSlots();

function isSameWeek(a, b) {
  return ymdInTz(startOfWeekMonday(a)) === ymdInTz(startOfWeekMonday(b));
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
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [noSource, setNoSource] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [dragSelect, setDragSelect] = useState(null);
  const [selectionError, setSelectionError] = useState(null);
  const dragSelectRef = useRef(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const isCurrentWeek = isSameWeek(weekStart, new Date());

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
    loadEvents(weekStart, activeHallId);
  }, [weekStart, activeHallId, loadEvents]);

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

  const finishDrag = useCallback(() => {
    const sel = dragSelectRef.current;
    if (!sel) return;
    commitRange(sel.ymd, sel.anchorSlot, sel.focusSlot);
    setDragSelect(null);
  }, [commitRange]);

  useEffect(() => {
    if (!dragSelect) return;
    function onPointerUp() {
      finishDrag();
    }
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragSelect, finishDrag]);

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
    const slotStart = slotStartFromIndex(ymd, slotIndex);
    const slotEnd = slotEndFromIndex(ymd, slotIndex);
    return !isSlotBusy(events, slotStart, slotEnd);
  }

  function handleDayPointerDown(e, ymd) {
    if (loading || e.button !== 0) return;
    const slotIndex = slotAtPointer(e.currentTarget, e.clientY);
    if (slotIndex == null || !isSlotFree(ymd, slotIndex)) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setBookingSlot(null);
    setSelectionError(null);
    setDragSelect({ ymd, anchorSlot: slotIndex, focusSlot: slotIndex });
  }

  function handleDayPointerMove(e, ymd) {
    const sel = dragSelectRef.current;
    if (!sel || sel.ymd !== ymd) return;
    const slotIndex = slotAtPointer(e.currentTarget, e.clientY);
    if (slotIndex == null || sel.focusSlot === slotIndex) return;
    if (!isSlotRangeFree(events, ymd, sel.anchorSlot, slotIndex)) return;
    setDragSelect({ ...sel, focusSlot: slotIndex });
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
    <div className={`${styles.wrap} ${compact ? styles.wrapCompact : ""}`}>
      <h2 className={styles.heading}>Календарь записи</h2>

      <div className={styles.hallTabs} role="tablist" aria-label="Выбор зала">
        {HALLS.map((hall) => (
          <button
            key={hall.id}
            type="button"
            role="tab"
            aria-selected={activeHallId === hall.id}
            className={`${styles.hallTab} ${activeHallId === hall.id ? styles.hallTabActive : ""}`}
            onClick={() => switchHall(hall.id)}
          >
            {hall.label}
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        Выделите интервал от 1 часа (шаг 30 минут): зажмите и протяните в одном дне или кликните слот — подставится
        соседний свободный получасовой интервал. Занято — «{BUSY_LABEL}».
      </p>

      <div className={styles.legend}>
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

      <div className={styles.toolbar}>
        <div className={styles.toolbarNav}>
          <button type="button" className={styles.navBtn} onClick={goPrevWeek} aria-label="Предыдущая неделя">
            ←
          </button>
          <button type="button" className={styles.navBtn} onClick={goNextWeek} aria-label="Следующая неделя">
            →
          </button>
        </div>
        <p className={styles.weekLabel}>{weekLabel}</p>
        {!isCurrentWeek ? (
          <button type="button" className={styles.todayBtn} onClick={goToday}>
            Сегодня
          </button>
        ) : (
          <span className={styles.toolbarSpacer} />
        )}
      </div>

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

      <div className={styles.calendarScroll}>
        <div
          className={styles.calendar}
          aria-label={`Недельное расписание — ${activeHall.label}`}
          data-loading={loading || undefined}
          data-selecting={dragSelect ? true : undefined}
        >
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
              const dayEvents = eventsForDay(events, ymd);
              const preview = getSelectionPreview(ymd);

              return (
                <div
                  key={ymd}
                  className={styles.dayColumn}
                  onPointerDown={(e) => handleDayPointerDown(e, ymd)}
                  onPointerMove={(e) => handleDayPointerMove(e, ymd)}
                >
                  <div className={styles.dayGrid}>
                    {SLOTS.map((slot) => {
                      const busy = !isSlotFree(ymd, slot.index);
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
                            busy
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
        </div>
      </div>

      {loading ? <p className={styles.loading}>Загрузка расписания…</p> : null}

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
