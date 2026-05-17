const YEKATERINBURG_OFFSET = "+05:00";

function parseIcsDate(value, tzid) {
  const v = String(value ?? "").trim();
  if (!v) return null;

  if (/^\d{8}T\d{6}Z$/.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    const hh = v.slice(9, 11);
    const mm = v.slice(11, 13);
    const ss = v.slice(13, 15);
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}Z`);
  }

  if (/^\d{8}T\d{6}$/.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    const hh = v.slice(9, 11);
    const mm = v.slice(11, 13);
    const ss = v.slice(13, 15);
    const offset =
      tzid === "Asia/Yekaterinburg" ||
      tzid === "Asia/Yekaterinburg Standard Time" ||
      tzid === "Asia/Tashkent"
        ? YEKATERINBURG_OFFSET
        : tzid === "Europe/Moscow"
          ? "+03:00"
          : "";
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}${offset}`);
  }

  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    return new Date(`${y}-${m}-${d}T00:00:00${YEKATERINBURG_OFFSET}`);
  }

  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function unfoldIcsLines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce((acc, line) => {
      if ((line.startsWith(" ") || line.startsWith("\t")) && acc.length) {
        acc[acc.length - 1] += line.slice(1);
      } else {
        acc.push(line);
      }
      return acc;
    }, []);
}

function parseProperty(line) {
  const sep = line.indexOf(":");
  if (sep === -1) return null;
  const rawKey = line.slice(0, sep);
  const key = rawKey.split(";")[0];
  const params = Object.fromEntries(
    rawKey
      .split(";")
      .slice(1)
      .map((p) => {
        const [k, v] = p.split("=");
        return [k, v];
      }),
  );
  return { key, params, value: line.slice(sep + 1) };
}

/** Минимальный разбор VEVENT из iCal (без названий событий). */
export function parseIcsEvents(icsText) {
  const lines = unfoldIcsLines(String(icsText ?? ""));
  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.start && current?.end) {
        events.push({ start: current.start, end: current.end });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const prop = parseProperty(line);
    if (!prop) continue;

    if (prop.key === "DTSTART") {
      current.start = parseIcsDate(prop.value, prop.params.TZID);
    }
    if (prop.key === "DTEND") {
      current.end = parseIcsDate(prop.value, prop.params.TZID);
    }
  }

  return events;
}
