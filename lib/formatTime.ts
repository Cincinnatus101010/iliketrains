/** NJ Rail schedule strings are in US Eastern (agency local time). */
export const NJ_SCHEDULE_TIME_ZONE = "America/New_York";

const NJ_DATED_TIME_RE = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s+(.+)$/i;

/** Parse NJ RailData datetime like "18-Sep-2026 11:52:00 AM" (no rollover — trust API calendar dates). */
export function parseNjScheduleAtMs(raw: string, _refMs = Date.now()): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(NJ_DATED_TIME_RE);
  if (match) {
    const [, day, mon, year, timePart] = match;
    const d = new Date(`${mon} ${day}, ${year} ${timePart}`);
    const t = d.getTime();
    return Number.isFinite(t) ? t : null;
  }

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
