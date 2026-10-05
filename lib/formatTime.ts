/** NJ Rail schedule strings are in US Eastern (agency local time). */
export const NJ_SCHEDULE_TIME_ZONE = "America/New_York";

const NJ_DATED_TIME_RE = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(.+)$/i;

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const CIVIL_TIME_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: NJ_SCHEDULE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parse12hClock(timePart: string): { hour: number; minute: number; second: number } | null {
  const m = timePart.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] ? Number(m[3]) : 0;
  const meridiem = m[4]!.toUpperCase();
  if (hour === 12) hour = 0;
  if (meridiem === "PM") hour += 12;
  return { hour, minute, second };
}

/** Wall-clock civil time in `timeZone` → UTC epoch ms. */
function zonedCivilTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): number {
  const wantUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = wantUtc;

  for (let i = 0; i < 4; i += 1) {
    const parts = Object.fromEntries(
      CIVIL_TIME_PARTS.formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const delta = wantUtc - asUtc;
    if (delta === 0) break;
    guess += delta;
  }

  return guess;
}

function parseDatedNjSchedule(raw: string): number | null {
  const match = raw.trim().match(NJ_DATED_TIME_RE);
  if (!match) return null;

  const [, dayStr, monStr, yearStr, timePart] = match;
  const month = MONTH_INDEX[monStr!.slice(0, 3).toLowerCase()];
  if (!month) return null;

  const clock = parse12hClock(timePart!);
  if (!clock) return null;

  const year = Number(yearStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(day)) return null;

  return zonedCivilTimeToUtcMs(year, month, day, clock.hour, clock.minute, clock.second);
}

/** Parse NJ RailData datetime like "18-Sep-2026 11:52:00 AM" (no rollover — trust API calendar dates). */
export function parseNjScheduleAtMs(raw: string, _refMs = Date.now()): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const dated = parseDatedNjSchedule(trimmed);
  if (dated != null) return dated;

  // Legacy fallback (matches older call sites / odd payloads).
  const d = new Date(trimmed.replace(/(\d{2})-(\w{3})-(\d{4})/i, "$2 $1, $3"));
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function nyDayKey(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NJ_SCHEDULE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

/** Departure label for schedule lists (fixed TZ/locale; includes day when not today). */
export function formatNjScheduleDeparture(
  raw: string | null | undefined,
  refMs = Date.now(),
): string {
  if (!raw?.trim()) return "—";
  const ms = parseNjScheduleAtMs(raw, refMs);
  if (ms == null) return raw.trim();

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: NJ_SCHEDULE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(ms);

  const depDay = nyDayKey(ms);
  const today = nyDayKey(refMs);
  if (depDay === today) return time;

  const tomorrowRef = refMs + 86_400_000;
  if (depDay === nyDayKey(tomorrowRef)) return `Tomorrow ${time}`;

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: NJ_SCHEDULE_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(ms);
  return `${date} · ${time}`;
}

/** Time-only format (legacy); prefer formatNjScheduleDeparture in schedule UIs. */
export function formatNjDateTime(raw: string | null | undefined): string {
  return formatNjScheduleDeparture(raw);
}
