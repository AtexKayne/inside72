import { NextResponse } from "next/server";
import { addDays, startOfWeekMonday } from "@/lib/hall-calendar";
import { fetchHallCalendarEvents } from "@/lib/hall-calendar-fetch";
import { DEFAULT_HALL_ID, isValidHallId } from "@/lib/halls";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hallParam = searchParams.get("hall")?.trim() || DEFAULT_HALL_ID;
  const hallId = isValidHallId(hallParam) ? hallParam : DEFAULT_HALL_ID;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const weekStart = fromParam ? new Date(fromParam) : startOfWeekMonday(new Date());
  const timeMin = Number.isNaN(weekStart.getTime())
    ? startOfWeekMonday(new Date()).toISOString()
    : weekStart.toISOString();

  const weekEnd = toParam ? new Date(toParam) : addDays(new Date(timeMin), 7);
  const timeMax = Number.isNaN(weekEnd.getTime())
    ? addDays(new Date(timeMin), 7).toISOString()
    : weekEnd.toISOString();

  try {
    const { events, source } = await fetchHallCalendarEvents(hallId, timeMin, timeMax);
    return NextResponse.json({
      events,
      source,
      hall: hallId,
      range: { from: timeMin, to: timeMax },
    });
  } catch (err) {
    console.error("[hall-calendar] route error:", err);
    return NextResponse.json(
      {
        events: [],
        source: null,
        hall: hallId,
        range: { from: timeMin, to: timeMax },
        error: "calendar_unavailable",
      },
      { status: 200 },
    );
  }
}
