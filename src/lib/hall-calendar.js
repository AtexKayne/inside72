import { DEFAULT_HALL_ID, getHallById } from "@/lib/halls";

export { DEFAULT_HALL_ID, getHallById, HALLS, isValidHallId } from "@/lib/halls";

/** @deprecated используйте calendarId зала из HALLS */
export const HALL_CALENDAR_ID = getHallById(DEFAULT_HALL_ID).calendarId;

export const HALL_CALENDAR_TIMEZONE = "Asia/Yekaterinburg";

/** Смещение для Asia/Yekaterinburg (без перехода на летнее время). */
const YEKATERINBURG_ISO_OFFSET = "+05:00";

const ISO_WEEKDAY = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function isoWeekdayInTz(date, tz = HALL_CALENDAR_TIMEZONE) {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date);
  return ISO_WEEKDAY[wd] ?? 1;
}

function dateAtTimeInHallTz(ymd, hour, minute = 0) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${ymd}T${hh}:${mm}:00${YEKATERINBURG_ISO_OFFSET}`);
}

export const HALL_OPEN_HOUR = 9;
export const HALL_CLOSE_HOUR = 22;
export const HALL_SLOT_MINUTES = 30;
export const HALL_MIN_RENTAL_MINUTES = 60;
export const HALL_MIN_RENTAL_SLOTS = HALL_MIN_RENTAL_MINUTES / HALL_SLOT_MINUTES;
export const HALL_SLOT_COUNT =
  ((HALL_CLOSE_HOUR - HALL_OPEN_HOUR) * 60) / HALL_SLOT_MINUTES;
export const BUSY_LABEL = "Занято";

/** Событие календаря без названия (приватность аренды). */
export function sanitizeHallEvent(raw) {
  const start = new Date(raw.start);
  const end = new Date(raw.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export function ymdInTz(date, tz = HALL_CALENDAR_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function minutesInTz(date, tz = HALL_CALENDAR_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 0;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** Понедельник календарной недели в часовом поясе зала. */
export function startOfWeekMonday(date, tz = HALL_CALENDAR_TIMEZONE) {
  const ymd = ymdInTz(date, tz);
  const ref = dateAtTimeInHallTz(ymd, 12, 0);
  const mondayYmd = addDaysYmd(ymd, -(isoWeekdayInTz(ref, tz) - 1));
  return dateAtTimeInHallTz(mondayYmd, 0, 0);
}

export function addDays(date, days, tz = HALL_CALENDAR_TIMEZONE) {
  const ymd = ymdInTz(date, tz);
  const newYmd = addDaysYmd(ymd, days);
  return dateAtTimeInHallTz(newYmd, 12, 0);
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatWeekRange(weekStart, tz = HALL_CALENDAR_TIMEZONE) {
  const weekEnd = addDays(weekStart, 6);
  const fmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    day: "numeric",
    month: "long",
  });
  return `${fmt.format(weekStart)} — ${fmt.format(weekEnd)}`;
}

export function formatDayHeader(date, tz = HALL_CALENDAR_TIMEZONE) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
  }).format(date);
}

export function formatHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatSlotTime(hour, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Старты слотов по 30 минут с HALL_OPEN_HOUR до HALL_CLOSE_HOUR. */
export function getHallSlots() {
  return Array.from({ length: HALL_SLOT_COUNT }, (_, index) => {
    const totalMin = HALL_OPEN_HOUR * 60 + index * HALL_SLOT_MINUTES;
    return {
      index,
      hour: Math.floor(totalMin / 60),
      minute: totalMin % 60,
    };
  });
}

export function formatTimeShort(date, tz = HALL_CALENDAR_TIMEZONE) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Человекочитаемая подпись выбранного слота для заявки. */
export function formatBookingSlot(start, end, tz = HALL_CALENDAR_TIMEZONE) {
  const dateFmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export function slotStartInTz(ymd, hour, minute = 0, tz = HALL_CALENDAR_TIMEZONE) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  if (tz === HALL_CALENDAR_TIMEZONE) {
    return new Date(`${ymd}T${hh}:${mm}:00${YEKATERINBURG_ISO_OFFSET}`);
  }

  const [y, m, d] = ymd.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  const offsetMin =
    minutesInTz(utcGuess, tz) -
    (utcGuess.getUTCHours() * 60 + utcGuess.getUTCMinutes());
  return new Date(utcGuess.getTime() - offsetMin * 60_000);
}

/** Событие попадает на календарный день ymd в заданной таймзоне. */
export function eventTouchesYmd(event, ymd, tz = HALL_CALENDAR_TIMEZONE) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  const startYmd = ymdInTz(start, tz);
  const endYmd = ymdInTz(end, tz);
  return startYmd <= ymd && endYmd >= ymd;
}

export function slotStartFromIndex(ymd, index, tz = HALL_CALENDAR_TIMEZONE) {
  const totalMin = HALL_OPEN_HOUR * 60 + index * HALL_SLOT_MINUTES;
  return slotStartInTz(ymd, Math.floor(totalMin / 60), totalMin % 60, tz);
}

export function slotEndFromIndex(ymd, index, tz = HALL_CALENDAR_TIMEZONE) {
  return slotStartFromIndex(ymd, index + 1, tz);
}

export function clipEventToHours(event, ymd, tz = HALL_CALENDAR_TIMEZONE) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayOpen = slotStartInTz(ymd, HALL_OPEN_HOUR, 0, tz);
  const dayClose = slotStartInTz(ymd, HALL_CLOSE_HOUR, 0, tz);

  const clippedStart = new Date(Math.max(start.getTime(), dayOpen.getTime()));
  const clippedEnd = new Date(Math.min(end.getTime(), dayClose.getTime()));
  if (clippedEnd <= clippedStart) return null;

  return { start: clippedStart, end: clippedEnd };
}

export function eventBlockStyle(start, end, tz = HALL_CALENDAR_TIMEZONE) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const dayMinutes = (HALL_CLOSE_HOUR - HALL_OPEN_HOUR) * 60;
  const topMin = Math.max(0, minutesInTz(startDate, tz) - HALL_OPEN_HOUR * 60);
  const bottomMin = Math.min(dayMinutes, minutesInTz(endDate, tz) - HALL_OPEN_HOUR * 60);
  const top = (topMin / dayMinutes) * 100;
  const height = Math.max(1.5, ((bottomMin - topMin) / dayMinutes) * 100);
  return { top: `${top}%`, height: `${height}%` };
}

export function eventsForDay(events, ymd, tz = HALL_CALENDAR_TIMEZONE) {
  return events
    .filter((e) => eventTouchesYmd(e, ymd, tz))
    .map((e) => clipEventToHours(e, ymd, tz))
    .filter(Boolean);
}

/** Объединяет занятые интервалы дня, если между ними меньше часа (или они вплотную). */
export function mergeNearbyDayEvents(
  dayEvents,
  gapMs = HALL_MIN_RENTAL_MINUTES * 60_000,
) {
  if (dayEvents.length === 0) return [];

  const sorted = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged = [{ start: sorted[0].start, end: sorted[0].end }];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const last = merged[merged.length - 1];
    const gap = curr.start.getTime() - last.end.getTime();

    if (gap < gapMs) {
      if (curr.end > last.end) last.end = curr.end;
    } else {
      merged.push({ start: curr.start, end: curr.end });
    }
  }

  return merged;
}

export function isSlotBusy(events, slotStart, slotEnd) {
  return events.some((e) => {
    const start = new Date(e.start);
    const end = new Date(e.end);
    return start < slotEnd && end > slotStart;
  });
}

/** Начало слота уже наступило (в часовом поясе зала). */
export function isSlotIndexPast(
  ymd,
  slotIndex,
  now = new Date(),
  tz = HALL_CALENDAR_TIMEZONE,
) {
  if (slotIndex < 0 || slotIndex >= HALL_SLOT_COUNT) return true;
  const slotStart = slotStartFromIndex(ymd, slotIndex, tz);
  return slotStart.getTime() < now.getTime();
}

/** Начало бронирования уже в прошлом. */
export function isBookingStartPast(start, now = new Date()) {
  const d = start instanceof Date ? start : new Date(start);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() < now.getTime();
}

export function isBookingSlotRangePast(
  ymd,
  slotFrom,
  slotTo,
  now = new Date(),
  tz = HALL_CALENDAR_TIMEZONE,
) {
  const { from } = slotRangeBounds(slotFrom, slotTo);
  return isSlotIndexPast(ymd, from, now, tz);
}

export function isSlotIndexBusy(
  events,
  ymd,
  slotIndex,
  tz = HALL_CALENDAR_TIMEZONE,
  now = new Date(),
) {
  if (slotIndex < 0 || slotIndex >= HALL_SLOT_COUNT) return true;
  if (isSlotIndexPast(ymd, slotIndex, now, tz)) return true;
  const slotStart = slotStartFromIndex(ymd, slotIndex, tz);
  const slotEnd = slotEndFromIndex(ymd, slotIndex, tz);
  return events.some((e) => {
    if (!eventTouchesYmd(e, ymd, tz)) return false;
    const start = new Date(e.start);
    const end = new Date(e.end);
    return start < slotEnd && end > slotStart;
  });
}

/** Слоты и непрерывный интервал [slotFrom..slotTo] не пересекают аренду и не в прошлом. */
export function isBookingSlotRangeFree(events, ymd, slotFrom, slotTo, now = new Date()) {
  const { from, to } = slotRangeBounds(slotFrom, slotTo);
  const bookingStart = slotStartFromIndex(ymd, from);
  const bookingEnd = slotEndFromIndex(ymd, to);
  if (bookingEnd <= bookingStart) return false;
  if (isBookingSlotRangePast(ymd, from, to, now)) return false;

  for (let i = from; i <= to; i++) {
    if (isSlotIndexBusy(events, ymd, i, HALL_CALENDAR_TIMEZONE, now)) return false;
  }

  return !events.some((e) => {
    if (!eventTouchesYmd(e, ymd)) return false;
    const start = new Date(e.start);
    const end = new Date(e.end);
    return start < bookingEnd && end > bookingStart;
  });
}

export function slotRangeBounds(slotA, slotB) {
  return {
    from: Math.min(slotA, slotB),
    to: Math.max(slotA, slotB),
  };
}

/**
 * Расширяет выбор до минимальной аренды (1 ч), если возможно на сетке.
 * @returns {{ ok: true, from: number, to: number } | { ok: false, reason: "busy" | "min_duration" | "past" }}
 */
export function slotRangeWithMinRental(ymd, slotA, slotB, events, now = new Date()) {
  const { from, to } = slotRangeBounds(slotA, slotB);
  const count = to - from + 1;

  if (isBookingSlotRangePast(ymd, from, to, now)) {
    return { ok: false, reason: "past" };
  }

  if (!isBookingSlotRangeFree(events, ymd, from, to, now)) {
    return { ok: false, reason: "busy" };
  }

  if (count >= HALL_MIN_RENTAL_SLOTS) {
    return { ok: true, from, to };
  }

  const need = HALL_MIN_RENTAL_SLOTS - count;
  const nextBusy = isSlotIndexBusy(events, ymd, to + 1, HALL_CALENDAR_TIMEZONE, now);
  const prevBusy = isSlotIndexBusy(events, ymd, from - 1, HALL_CALENDAR_TIMEZONE, now);

  const expandAfter = () => {
    const rangeTo = to + need;
    if (rangeTo >= HALL_SLOT_COUNT) return null;
    return isBookingSlotRangeFree(events, ymd, from, rangeTo, now) ? { from, to: rangeTo } : null;
  };

  const expandBefore = () => {
    const rangeFrom = from - need;
    if (rangeFrom < 0) return null;
    return isBookingSlotRangeFree(events, ymd, rangeFrom, to, now) ? { from: rangeFrom, to } : null;
  };

  const attempts = [];
  if (nextBusy && !prevBusy) {
    attempts.push(expandBefore, expandAfter);
  } else if (prevBusy && !nextBusy) {
    attempts.push(expandAfter, expandBefore);
  } else {
    const preferForward = slotB >= slotA;
    attempts.push(
      preferForward ? expandAfter : expandBefore,
      preferForward ? expandBefore : expandAfter,
    );
  }

  for (const attempt of attempts) {
    const result = attempt();
    if (result) return { ok: true, ...result };
  }

  const blockedByBusy =
    (nextBusy &&
      !isBookingSlotRangeFree(events, ymd, from, Math.min(HALL_SLOT_COUNT - 1, to + need), now)) ||
    (prevBusy && !isBookingSlotRangeFree(events, ymd, Math.max(0, from - need), to, now));

  return { ok: false, reason: blockedByBusy ? "busy" : "min_duration" };
}

/** Все 30-минутные слоты в диапазоне индексов [fromIndex, toIndex] включительно свободны. */
export function isSlotRangeFree(events, ymd, slotA, slotB) {
  return isBookingSlotRangeFree(events, ymd, slotA, slotB);
}

export function slotRangeBlockStyle(fromIndex, toIndex) {
  const total = (HALL_CLOSE_HOUR - HALL_OPEN_HOUR) * 60;
  const topMin = fromIndex * HALL_SLOT_MINUTES;
  const bottomMin = (toIndex + 1) * HALL_SLOT_MINUTES;
  const top = Math.max(0, (topMin / total) * 100);
  const height = Math.max(1.5, ((bottomMin - topMin) / total) * 100);
  return { top: `${top}%`, height: `${height}%` };
}

/** @deprecated используйте slotRangeBounds */
export const hourRangeBounds = slotRangeBounds;

/** @deprecated используйте isSlotRangeFree */
export const isHourRangeFree = isSlotRangeFree;

/** @deprecated используйте slotRangeBlockStyle */
export const hourRangeBlockStyle = slotRangeBlockStyle;
