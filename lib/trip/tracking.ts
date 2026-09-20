import type { SavedTrip } from "./savedTrip";
import { parseTripTrackingState, type TripTrackingState } from "./trackingState";

/** Live map id for the trip's chosen NJ departure, when known. */
export function liveTrainIdForChosenDeparture(trip: SavedTrip): string | null {
  const raw = trip.chosenDeparture?.trainId?.trim();
  if (!raw) return null;
  const num = Number.parseInt(raw, 10);
  if (Number.isFinite(num)) return `njt-${num}`;
  return `njt-${raw}`;
}

function trackingStateForTrip(trip: SavedTrip): TripTrackingState | undefined {
  return trip.tracking;
}

/** Which train we track (onboard / follow), if any — read only from a saved trip. */
export function trackingTrainIdForTrip(trip: SavedTrip | null | undefined): string | null {
  if (!trip) return null;
  const state = trackingStateForTrip(trip);
  if (state?.mode === "off") return null;
  if (state?.mode === "train") return state.trainId;
  return liveTrainIdForChosenDeparture(trip);
}

/** Active tracking id: from the saved trip, or ephemeral follow when there is no trip. */
export function effectiveTrackingTrainId(
  trip: SavedTrip | null | undefined,
  orphanTrackingId: string | null,
): string | null {
  if (trip) return trackingTrainIdForTrip(trip);
  return orphanTrackingId;
}

export function tripWithTracking(trip: SavedTrip, trainId: string | null): SavedTrip {
  if (trainId === null) return { ...trip, tracking: { mode: "off" } };
  return { ...trip, tracking: { mode: "train", trainId } };
}

/** Persist default tracking when starting a trip from the planner. */
export function prepareTripForStart(trip: SavedTrip): SavedTrip {
  if (trip.tracking !== undefined) return trip;
  if (liveTrainIdForChosenDeparture(trip)) return { ...trip, tracking: { mode: "auto" } };
  return trip;
}

export { parseTripTrackingState, type TripTrackingState };
