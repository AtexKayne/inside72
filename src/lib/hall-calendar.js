export const HALL_CALENDAR_ID = "asantepler@gmail.com";

export const HALL_CALENDAR_TIMEZONE = "Asia/Yekaterinburg";

export const HALL_OPEN_HOUR = 9;
export const HALL_CLOSE_HOUR = 22;
export const BUSY_LABEL = "Занято";

const DEFAULT_ICAL_URL =
  "https://calendar.google.com/calendar/ical/asantepler%40gmail.com/public/basic.ics";

export function getHallIcalUrl() {
  const fromEnv = process.env.HALL_ICAL_URL?.trim();
  return fromEnv || DEFAULT_ICAL_URL;
}

/** @deprecated используйте getHallIcalUrl */
export const HALL_ICAL_URL = DEFAULT_ICAL_URL;

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
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
  const yearFmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    year: "numeric",
  });
  const startStr = fmt.format(weekStart);
  const endStr = fmt.format(weekEnd);
  const year = yearFmt.format(weekEnd);
  return `${startStr} — ${endStr} ${year}`;
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

export function formatTimeShort(date, tz = HALL_CALENDAR_TIMEZONE) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatGoogleCalendarDate(date, tz = HALL_CALENDAR_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}${pick("month")}${pick("day")}T${pick("hour")}${pick("minute")}${pick("second")}`;
}

/** Ссылка на создание события «Аренда зала» в Google Calendar. */
export function buildHallBookingUrl(start, end) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Аренда зала Inside",
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
    ctz: HALL_CALENDAR_TIMEZONE,
    details: "Самостоятельная подготовка. Подтвердите запись с администратором студии.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function slotStartInTz(ymd, hour, tz = HALL_CALENDAR_TIMEZONE) {
  const [y, m, d] = ymd.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
  const offsetMin =
    minutesInTz(utcGuess, tz) -
    (utcGuess.getUTCHours() * 60 + utcGuess.getUTCMinutes());
  return new Date(utcGuess.getTime() - offsetMin * 60_000);
}

export function clipEventToHours(event, ymd) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayOpen = slotStartInTz(ymd, HALL_OPEN_HOUR);
  const dayClose = slotStartInTz(ymd, HALL_CLOSE_HOUR);

  const clippedStart = new Date(Math.max(start.getTime(), dayOpen.getTime()));
  const clippedEnd = new Date(Math.min(end.getTime(), dayClose.getTime()));
  if (clippedEnd <= clippedStart) return null;

  return { start: clippedStart, end: clippedEnd };
}

export function eventBlockStyle(start, end) {
  const total = (HALL_CLOSE_HOUR - HALL_OPEN_HOUR) * 60;
  const topMin = minutesInTz(start) - HALL_OPEN_HOUR * 60;
  const bottomMin = minutesInTz(end) - HALL_OPEN_HOUR * 60;
  const top = Math.max(0, (topMin / total) * 100);
  const height = Math.max(2.5, ((bottomMin - topMin) / total) * 100);
  return { top: `${top}%`, height: `${height}%` };
}

export function eventsForDay(events, ymd) {
  const dayOpen = slotStartInTz(ymd, HALL_OPEN_HOUR);
  const dayClose = slotStartInTz(ymd, HALL_CLOSE_HOUR);

  return events
    .filter((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      return start < dayClose && end > dayOpen;
    })
    .map((e) => clipEventToHours(e, ymd))
    .filter(Boolean);
}

export function isSlotBusy(events, slotStart, slotEnd) {
  return events.some((e) => {
    const start = new Date(e.start);
    const end = new Date(e.end);
    return start < slotEnd && end > slotStart;
  });
}
