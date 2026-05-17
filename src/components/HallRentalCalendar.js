"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BUSY_LABEL,
  HALL_CLOSE_HOUR,
  HALL_OPEN_HOUR,
  addDays,
  buildHallBookingUrl,
  eventBlockStyle,
  eventsForDay,
  formatDayHeader,
  formatHourLabel,
  formatTimeShort,
  formatWeekRange,
  getWeekDays,
  isSlotBusy,
  slotStartInTz,
  startOfWeekMonday,
  ymdInTz,
} from "@/lib/hall-calendar";
import styles from "./hall-rental-calendar.module.scss";

const HOURS = Array.from(
  { length: HALL_CLOSE_HOUR - HALL_OPEN_HOUR },
  (_, i) => HALL_OPEN_HOUR + i,
);

function isSameWeek(a, b) {
  return ymdInTz(startOfWeekMonday(a)) === ymdInTz(startOfWeekMonday(b));
}

export function HallRentalCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [noSource, setNoSource] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const isCurrentWeek = isSameWeek(weekStart, new Date());

  const loadEvents = useCallback(async (start) => {
    setLoading(true);
    setLoadError(false);

    const from = start.toISOString();
    const to = addDays(start, 7).toISOString();

    try {
      const res = await fetch(
        `/api/hall-calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
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
    loadEvents(weekStart);
  }, [weekStart, loadEvents]);

  function goPrevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }

  function goNextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }

  function goToday() {
    setWeekStart(startOfWeekMonday(new Date()));
  }

  function handleSlotClick(ymd, hour) {
    const start = slotStartInTz(ymd, hour);
    const end = slotStartInTz(ymd, hour + 1);
    if (isSlotBusy(events, start, end)) return;
    window.open(buildHallBookingUrl(start, end), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>Календарь записи</h2>
      <p className={styles.hint}>
        Нажмите на свободный час, чтобы оформить запись. Занятые слоты показаны как «{BUSY_LABEL}» без
        подробностей.
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

      {loadError ? (
        <p className={styles.alert} role="alert">
          Не удалось загрузить расписание. Попробуйте обновить страницу или свяжитесь с администратором.
        </p>
      ) : null}

      {noSource && !loading && !loadError ? (
        <p className={styles.alertMuted}>
          Календарь пока недоступен для синхронизации — свободные слоты отображаются по умолчанию. Для записи
          используйте кнопки свободных часов или напишите в студию.
        </p>
      ) : null}

      <div className={styles.calendarScroll}>
        <div
          className={styles.calendar}
          aria-label="Недельное расписание аренды зала"
          data-loading={loading || undefined}
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
              {HOURS.map((hour) => (
                <div key={hour} className={styles.timeLabel}>
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const ymd = ymdInTz(day);
              const dayEvents = eventsForDay(events, ymd);

              return (
                <div key={ymd} className={styles.dayColumn}>
                  <div className={styles.dayGrid}>
                    {HOURS.map((hour) => {
                      const slotStart = slotStartInTz(ymd, hour);
                      const slotEnd = slotStartInTz(ymd, hour + 1);
                      const busy = isSlotBusy(events, slotStart, slotEnd);

                      return (
                        <button
                          key={hour}
                          type="button"
                          className={`${styles.slot} ${busy ? styles.slotBusy : styles.slotFree}`}
                          disabled={busy || loading}
                          aria-label={
                            busy
                              ? `${formatDayHeader(day)}, ${formatHourLabel(hour)} — ${BUSY_LABEL}`
                              : `${formatDayHeader(day)}, ${formatHourLabel(hour)} — записаться`
                          }
                          onClick={() => handleSlotClick(ymd, hour)}
                        />
                      );
                    })}
                  </div>

                  <div className={styles.eventsLayer} aria-hidden={dayEvents.length === 0}>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? <p className={styles.loading}>Загрузка расписания…</p> : null}
    </div>
  );
}
