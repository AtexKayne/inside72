import {
  getHallIcalUrl,
  HALL_CALENDAR_ID,
  sanitizeHallEvent,
} from "@/lib/hall-calendar";
import { parseIcsEvents } from "@/lib/ics";

const FETCH_HEADERS = {
  "User-Agent": "InsideStudio/1.0 (+https://www.inside72.ru)",
  Accept: "text/calendar, text/plain, */*",
};

async function fetchFromIcal() {
  const url = getHallIcalUrl();
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: FETCH_HEADERS,
  });

  if (!res.ok) {
    console.warn("[hall-calendar] iCal HTTP", res.status, url);
    return null;
  }

  const text = await res.text();
  const parsed = parseIcsEvents(text);

  return parsed
    .map((event) => sanitizeHallEvent(event))
    .filter(Boolean);
}

async function fetchFromGoogleApi(timeMin, timeMax) {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY?.trim();
  if (!apiKey) return null;

  const calendarId = encodeURIComponent(HALL_CALENDAR_ID);
  const params = new URLSearchParams({
    key: apiKey,
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    console.warn("[hall-calendar] Google API HTTP", res.status);
    return null;
  }

  const data = await res.json();
  if (!Array.isArray(data.items)) return [];

  return data.items
    .map((item) => {
      const rawStart = item.start?.dateTime ?? item.start?.date;
      const rawEnd = item.end?.dateTime ?? item.end?.date;
      if (!rawStart || !rawEnd) return null;

      let start = new Date(rawStart);
      let end = new Date(rawEnd);

      if (item.start?.date && !item.start?.dateTime) {
        end = new Date(end);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
      }

      return sanitizeHallEvent({ start, end });
    })
    .filter(Boolean);
}

function filterByRange(events, timeMin, timeMax) {
  const min = new Date(timeMin).getTime();
  const max = new Date(timeMax).getTime();
  return events.filter((e) => {
    const start = new Date(e.start).getTime();
    const end = new Date(e.end).getTime();
    return start < max && end > min;
  });
}

/** Загрузка занятости: iCal → Google Calendar API. */
export async function fetchHallCalendarEvents(timeMin, timeMax) {
  try {
    const icalEvents = await fetchFromIcal();
    if (icalEvents !== null) {
      return {
        events: filterByRange(icalEvents, timeMin, timeMax),
        source: "ical",
      };
    }
  } catch (err) {
    console.error("[hall-calendar] iCal parse failed:", err);
  }

  try {
    const googleEvents = await fetchFromGoogleApi(timeMin, timeMax);
    if (googleEvents !== null) {
      return {
        events: googleEvents,
        source: "google",
      };
    }
  } catch (err) {
    console.error("[hall-calendar] Google API failed:", err);
  }

  return { events: [], source: null };
}
