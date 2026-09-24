import { normalizeNjTrainId } from "@/lib/nj/normalizeTrainId";
import type { SavedTrip } from "./savedTrip";
import type { TripTrackingState } from "./trackingState";

/** Live map id for the trip's chosen NJ departure, when known. */
export function liveTrainIdForChosenDeparture(trip: SavedTrip): string | null {
  const raw = trip.chosenDeparture?.trainId?.trim();
  if (!raw) return null;
  return `njt-${normalizeNjTrainId(raw)}`;
}

/** Which train we track (onboard / follow), if any — read only from a saved trip. */
export function trackingTrainIdForTrip(trip: SavedTrip | null | undefined): string | null {
  if (!trip) return null;
  const state: TripTrackingState | undefined = trip.tracking;
  if (state?.mode === "off") return null;
  if (state?.mode === "train") return state.trainId;
  return liveTrainIdForChosenDeparture(trip);
}

/** Active tracking id: from the saved trip, or map-only follow when there is no trip. */
export function effectiveTrackingTrainId(
  trip: SavedTrip | null | undefined,
  ephemeralTrackingId: string | null,
): string | null {
  if (trip) return trackingTrainIdForTrip(trip);
  return ephemeralTrackingId;
}

export function tripWithTracking(trip: SavedTrip, trainId: string | null): SavedTrip {
  if (trainId === null) return { ...trip, tracking: { mode: "off" } };
  const departureId = liveTrainIdForChosenDeparture(trip);
  if (departureId && departureId === trainId) {
    return { ...trip, tracking: { mode: "auto" } };
  }
  return { ...trip, tracking: { mode: "train", trainId } };
}

/** After load, collapse redundant train tracking when it matches chosen departure. */
export function normalizePersistedTracking(trip: SavedTrip): SavedTrip {
  if (trip.tracking?.mode !== "train") return trip;
  const departureId = liveTrainIdForChosenDeparture(trip);
  if (departureId && departureId === trip.tracking.trainId) {
    return { ...trip, tracking: { mode: "auto" } };
  }
  return trip;
}

/** Persist default tracking when starting a trip from the planner. */
export function prepareTripForStart(trip: SavedTrip): SavedTrip {
  if (trip.tracking !== undefined) return trip;
  if (liveTrainIdForChosenDeparture(trip)) return { ...trip, tracking: { mode: "auto" } };
  return trip;
}
