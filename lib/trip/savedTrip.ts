import type { ScheduleDeparture } from "@/lib/types";
import { normalizePersistedTracking } from "./tracking";
import type { TripTrackingState } from "./trackingState";
import { parseTripTrackingState, trackingStateFromLegacyId } from "./trackingState";
import { activeTripOrNull } from "./tripExpiry";
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
  /** How onboard tracking is resolved (auto uses chosen departure when possible). */
  tracking?: TripTrackingState;
};

const STORAGE_KEY = "iliketrains.savedTrip.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Validate JSON from localStorage before trusting it as a SavedTrip. */
export function parseSavedTrip(raw: unknown): SavedTrip | null {
  if (!isRecord(raw)) return null;
  const fromKey = raw.fromKey;
  const toKey = raw.toKey;
  const fromName = raw.fromName;
  const toName = raw.toName;
  const savedAt = raw.savedAt;
  const route = raw.route;
  if (typeof fromKey !== "string" || !fromKey) return null;
  if (typeof toKey !== "string" || !toKey) return null;
  if (typeof fromName !== "string" || !fromName) return null;
  if (typeof toName !== "string" || !toName) return null;
  if (typeof savedAt !== "string" || !savedAt) return null;
  if (!isRecord(route) || !Array.isArray(route.steps)) return null;

  const trip: SavedTrip = {
    fromKey,
    toKey,
    fromName,
    toName,
    savedAt,
    route: route as SavedTrip["route"],
  };

  if (raw.chosenDeparture !== undefined && raw.chosenDeparture !== null) {
    trip.chosenDeparture = raw.chosenDeparture as SavedTrip["chosenDeparture"];
  }

  const parsedTracking = parseTripTrackingState(raw.tracking);
  if (parsedTracking) {
    trip.tracking = parsedTracking;
  } else if (raw.trackingTrainId !== undefined) {
    trip.tracking = trackingStateFromLegacyId(raw.trackingTrainId as string | null);
  }

  return normalizePersistedTracking(trip);
}

export function readSavedTrip(): SavedTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseSavedTrip(JSON.parse(raw));
    const active = activeTripOrNull(parsed);
    if (parsed && !active) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return active;
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
