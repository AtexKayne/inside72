const HALL_1_ICAL_DEFAULT =
  "https://calendar.google.com/calendar/ical/inside.dance72%40gmail.com/public/basic.ics";

const HALL_2_ICAL_DEFAULT =
  "https://calendar.google.com/calendar/ical/3d0e20117359512dbcaed231b4d165431fc8abc51e8757868dddcddf2339e461%40group.calendar.google.com/public/basic.ics";

export const HALL_2_AVAILABLE_FROM = "2026-06-01";

const HALL_TIMEZONE = "Asia/Yekaterinburg";

/** @type {{ id: string; label: string; icalUrl: string; calendarId: string; availableFrom?: string }[]} */
export const HALLS = [
  {
    id: "hall1",
    label: "Зал 1",
    icalUrl: process.env.HALL_1_ICAL_URL?.trim() || HALL_1_ICAL_DEFAULT,
    calendarId: process.env.HALL_1_CALENDAR_ID?.trim() || "inside.dance72@gmail.com",
  },
  {
    id: "hall2",
    label: "Зал 2",
    icalUrl: process.env.HALL_2_ICAL_URL?.trim() || HALL_2_ICAL_DEFAULT,
    calendarId:
      process.env.HALL_2_CALENDAR_ID?.trim() ||
      "3d0e20117359512dbcaed231b4d165431fc8abc51e8757868dddcddf2339e461@group.calendar.google.com",
    availableFrom: HALL_2_AVAILABLE_FROM,
  },
];

function ymdInHallTz(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HALL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isHallAvailable(hall, date = new Date()) {
  if (!hall.availableFrom) return true;
  return ymdInHallTz(date) >= hall.availableFrom;
}

export function isHallComingSoon(hall, date = new Date()) {
  return Boolean(hall.availableFrom && !isHallAvailable(hall, date));
}

export const DEFAULT_HALL_ID = HALLS[0].id;

export function getHallById(id) {
  return HALLS.find((h) => h.id === id) ?? HALLS[0];
}

export function isValidHallId(id) {
  return HALLS.some((h) => h.id === id);
}
