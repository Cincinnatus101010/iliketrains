import type { SavedTrip } from "./savedTrip";

/** Live map id for the trip's chosen NJ departure, when known. */
export function liveTrainIdForChosenDeparture(trip: SavedTrip): string | null {
  const raw = trip.chosenDeparture?.trainId?.trim();
  if (!raw) return null;
  const num = Number.parseInt(raw, 10);
  if (Number.isFinite(num)) return `njt-${num}`;
  return `njt-${raw}`;
}

/** Which train we track (onboard / follow), if any — read only from a saved trip. */
export function trackingTrainIdForTrip(trip: SavedTrip | null | undefined): string | null {
  if (!trip) return null;
  if (trip.trackingTrainId === null) return null;
  const explicit = trip.trackingTrainId?.trim();
  if (explicit) return explicit;
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
  return { ...trip, trackingTrainId: trainId };
}

/** Persist default tracking when starting a trip from the planner. */
export function prepareTripForStart(trip: SavedTrip): SavedTrip {
  if (trip.trackingTrainId !== undefined) return trip;
  const id = liveTrainIdForChosenDeparture(trip);
  return id ? tripWithTracking(trip, id) : trip;
}
