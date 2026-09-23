import { parseNjScheduleAtMs } from "@/lib/formatTime";
import { dedupeUpcomingDepartures } from "@/lib/nj/dedupeDepartures";
import type { PlannedRoute, RouteStep, ScheduleDeparture } from "@/types";
import { firstRideStep } from "./firstRideStep";

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

/** Ride segments on the plan (where you are headed). */
function plannedRideDestinations(route: PlannedRoute): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const step of route.steps) {
    if (step.kind !== "ride" || !step.route) continue;
    const norm = normalizeName(step.toName);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      names.push(norm);
    }
  }
  return names;
}

function destinationMatchesStop(destRaw: string, stopNorm: string): boolean {
  const dest = normalizeName(destRaw);
  if (!dest || !stopNorm) return false;
  if (dest.includes(stopNorm) || stopNorm.includes(dest)) return true;
  for (const token of stopNorm.split(/\s+/)) {
    if (token.length >= 4 && dest.includes(token)) return true;
  }
  return false;
}

function tripHeadsToNySide(targetNorm: string): boolean {
  if (targetNorm.includes("newark broad")) return false;
  return (
    targetNorm.includes("hoboken") ||
    targetNorm.includes("new york") ||
    targetNorm.includes("secaucus") ||
    targetNorm.includes("newark penn")
  );
}

function tripHeadsToMorrisWest(targetNorm: string): boolean {
  return (
    targetNorm.includes("dover") ||
    targetNorm.includes("hackettstown") ||
    targetNorm.includes("netcong") ||
    targetNorm.includes("mount arlington")
  );
}

/** Drop departures that clearly run the other way on common NJ lines. */
function isLikelyOppositeDirection(destRaw: string, firstLeg: RouteStep): boolean {
  const dest = normalizeName(destRaw);
  const target = normalizeName(firstLeg.toName);
  const routeCode = (firstLeg.route ?? "").toUpperCase();

  if (routeCode === "MNE" || routeCode === "MNEG" || routeCode === "BNTN") {
    if (tripHeadsToNySide(target)) {
      return (
        dest.includes("dover") ||
        dest.includes("hackettstown") ||
        dest.includes("netcong") ||
        dest.includes("mount arlington") ||
        dest.includes("lake hopatcong")
      );
    }
    // Westbound / transfer at Newark Broad: Dover & Morris trains still stop there.
    if (tripHeadsToMorrisWest(target) || target.includes("newark broad")) {
      return dest.includes("hoboken") || dest.includes("new york");
    }
  }

  if (routeCode === "NEC" || routeCode === "NJCL") {
    if (target.includes("new york") || target.includes("penn")) {
      return dest.includes("trenton") && !target.includes("trenton");
    }
    if (target.includes("trenton")) {
      return dest.includes("new york") && !target.includes("new york");
    }
  }

  return false;
}

/** Whether this departure’s destination is the trip’s final rail stop (no transfer). */
export function boardingDepartureKind(
  route: PlannedRoute,
  item: ScheduleDeparture,
): "direct" | "transfer" {
  const rides = route.steps.filter((s) => s.kind === "ride" && s.route);
  if (rides.length <= 1) return "direct";
  const finalStop = rides.at(-1)!.toName;
  if (destinationMatchesStop(item.destination, normalizeName(finalStop))) return "direct";
  return "transfer";
}

export function boardingDepartureKindLabel(
  kind: "direct" | "transfer",
  route: PlannedRoute,
): string {
  if (kind === "direct") return "Direct";
  const n = route.stats?.transferCount ?? 1;
  return n === 1 ? "1 transfer" : `${n} transfers`;
}

/** Keep departures at this stop that aren’t clearly the wrong direction. */
export function filterDeparturesTowardTrip(
  items: ScheduleDeparture[],
  route: PlannedRoute,
): ScheduleDeparture[] {
  const firstLeg = firstRideStep(route);
  if (!firstLeg?.route) return items;

  const stops = plannedRideDestinations(route);
  return items.filter((item) => {
    if (stops.some((stop) => destinationMatchesStop(item.destination, stop))) return true;
    if (isLikelyOppositeDirection(item.destination, firstLeg)) return false;
    return true;
  });
}
