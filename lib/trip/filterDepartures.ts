import { parseNjScheduleAtMs } from "@/lib/formatTime";
import { dedupeUpcomingDepartures } from "@/lib/nj/dedupeDepartures";
import { canonicalNjRoute } from "@/lib/nj/njRoutes";
import type { ScheduleDeparture } from "@/lib/types";
import type { RouteStep } from "./types";

const SCHEDULE_GRACE_MS = 2 * 60 * 1000;

/** Drop departures before the rider can reach the boarding stop. */
export function filterDeparturesAfterArrival(
  items: ScheduleDeparture[],
  walkMinutes: number,
  nowMs = Date.now(),
): ScheduleDeparture[] {
  const cutoff = nowMs + walkMinutes * 60_000 - SCHEDULE_GRACE_MS;
  const afterArrival = items.filter((item) => {
    const at = parseNjScheduleAtMs(item.scheduledAt, nowMs);
    return at != null && at >= cutoff;
  });
  return dedupeUpcomingDepartures(afterArrival, nowMs);
}

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prefer departures on the first ride line that head toward the planned exit stop. */
export function filterDeparturesForFirstLeg(
  items: ScheduleDeparture[],
  step: RouteStep,
): ScheduleDeparture[] {
  const route = canonicalNjRoute(step.route) ?? step.route?.toUpperCase() ?? "";
  const onLine = items.filter((i) => {
    const itemRoute =
      canonicalNjRoute(i.lineAbbrev) ?? canonicalNjRoute(i.lineCode) ?? canonicalNjRoute(i.line);
    return itemRoute === route;
  });
  if (onLine.length === 0) return items;

  const target = normalizeName(step.toName);
  const towardExit = onLine.filter((i) => {
    const dest = normalizeName(i.destination);
    if (dest.includes(target) || target.includes(dest)) return true;
    const targetWord = target.split(" ")[0] ?? target;
    return dest.includes(targetWord);
  });

  return towardExit.length > 0 ? towardExit : onLine;
}
