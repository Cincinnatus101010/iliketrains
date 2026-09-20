import type { ScheduleDeparture } from "@/lib/types";
import { ensureRouteStats, tripStatsHeadline } from "./tripStats";
import type { PlannedRoute } from "./types";

export type SavedTrip = {
  fromKey: string;
  toKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute;
  savedAt: string;
  /** NJ (or first-leg) departure chosen when starting from the schedule list. */
  chosenDeparture?: ScheduleDeparture | null;
  /** Live train id while onboard; defaults from chosenDeparture when unset. */
  trackingTrainId?: string | null;
};

const STORAGE_KEY = "iliketrains.savedTrip.v1";

export function readSavedTrip(): SavedTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedTrip;
    if (!parsed?.fromKey || !parsed?.toKey || !parsed?.route?.steps) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedTrip(trip: SavedTrip | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!trip) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch {
    /* quota / private mode */
  }
}

export function tripSummaryLabel(trip: SavedTrip): string {
  const route = ensureRouteStats(trip.route);
  if (route.stats) return tripStatsHeadline(route.stats);
  const rides = route.steps.filter((s) => s.kind === "ride").length;
  const walks = route.steps.filter((s) => s.kind === "walk").length;
  const parts: string[] = [];
  if (rides > 0) parts.push(`${rides} ride${rides === 1 ? "" : "s"}`);
  if (walks > 0) parts.push(`${walks} walk${walks === 1 ? "" : "s"}`);
  return parts.join(" · ") || `${route.stopCount} stops`;
}
