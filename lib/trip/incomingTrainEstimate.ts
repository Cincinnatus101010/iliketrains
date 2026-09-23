import type { PlannedRoute, SavedTrip, ScheduleDeparture } from "@/types";
import { msUntilBoarding } from "./chosenDepartureEta";
import { firstRideStep } from "./firstRideStep";
import { haversineMeters } from "./geo";

const MIN_LEAD_MS = 20 * 60 * 1000;
const MAX_LEAD_MS = 90 * 60 * 1000;

/** Graph node index along `coordinatesLonLat` for the first rail boarding stop. */
export function boardingNodeIndex(route: PlannedRoute): number {
  const firstRide = firstRideStep(route);
  if (!firstRide?.fromKey) return 0;

  let idx = 0;
  for (const step of route.steps) {
    if (step.kind === "ride" && step.route && step.fromKey === firstRide.fromKey) {
      return Math.min(idx, route.coordinatesLonLat.length - 1);
    }
    idx += 1;
  }
  return Math.min(idx, route.coordinatesLonLat.length - 1);
}

function pointAlongPath(
  coords: [number, number][],
  endIndex: number,
  fraction: number,
): [number, number] | null {
  const slice = coords.slice(0, Math.min(endIndex, coords.length - 1) + 1);
  if (slice.length === 0) return null;
  if (slice.length === 1) return slice[0]!;

  const clamped = Math.max(0, Math.min(1, fraction));
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 1; i < slice.length; i++) {
    const a = slice[i - 1]!;
    const b = slice[i]!;
    const len = haversineMeters(a[1], a[0], b[1], b[0]);
    segLengths.push(len);
    total += len;
  }
  if (total <= 0) return slice[slice.length - 1]!;

  let remaining = clamped * total;
  for (let i = 0; i < segLengths.length; i++) {
    const len = segLengths[i]!;
    if (remaining <= len || i === segLengths.length - 1) {
      const t = len > 0 ? remaining / len : 0;
      const a = slice[i]!;
      const b = slice[i + 1]!;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    remaining -= len;
  }
  return slice[slice.length - 1]!;
}

/** 0 = still upstream; 1 = at the boarding stop (by schedule). */
export function incomingApproachProgress(dep: ScheduleDeparture, nowMs = Date.now()): number {
  const msUntil = msUntilBoarding(dep, nowMs);
  if (msUntil == null) return 1;
  if (msUntil <= 0) return 1;
  const lead = Math.min(MAX_LEAD_MS, Math.max(MIN_LEAD_MS, msUntil));
  return 1 - msUntil / lead;
}

export function boardingLonLat(trip: SavedTrip): [number, number] | null {
  const coords = trip.route.coordinatesLonLat;
  if (coords.length === 0) return null;
  const boardingIdx = boardingNodeIndex(trip.route);
  return coords[Math.min(boardingIdx, coords.length - 1)] ?? null;
}

/**
 * Fallback position along the trip graph (station path) when track geometry is unavailable.
 */
export function estimateIncomingLngLat(
  trip: SavedTrip,
  dep: ScheduleDeparture,
  nowMs = Date.now(),
): [number, number] | null {
  const coords = trip.route.coordinatesLonLat;
  if (coords.length < 2) return coords[0] ?? null;

  const boardingIdx = boardingNodeIndex(trip.route);
  const progress = incomingApproachProgress(dep, nowMs);
  return pointAlongPath(coords, boardingIdx, progress);
}
