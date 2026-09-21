import type { SavedTrip } from "./savedTrip";

/** Active trips older than this are cleared automatically. */
export const TRIP_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function savedAtIsoMs(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function tripSavedAtMs(trip: SavedTrip): number | null {
  return savedAtIsoMs(trip.savedAt);
}

export function isTripExpired(trip: SavedTrip, nowMs = Date.now()): boolean {
  const savedMs = tripSavedAtMs(trip);
  if (savedMs === null) return true;
  return nowMs - savedMs >= TRIP_MAX_AGE_MS;
}

export function msUntilTripExpires(trip: SavedTrip, nowMs = Date.now()): number {
  const savedMs = tripSavedAtMs(trip);
  if (savedMs === null) return 0;
  return Math.max(0, savedMs + TRIP_MAX_AGE_MS - nowMs);
}

export function activeTripOrNull(trip: SavedTrip | null, nowMs = Date.now()): SavedTrip | null {
  if (!trip) return null;
  return isTripExpired(trip, nowMs) ? null : trip;
}
