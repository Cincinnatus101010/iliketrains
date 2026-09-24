import type { LiveTrain } from "@/types";
import { resolveTrackedTrain } from "./resolveTrackedTrain";
import type { SavedTrip } from "./savedTrip";
import { trackingTrainIdForTrip } from "./tracking";

/** Chosen schedule departure is set but that train is not in the merged live feed yet. */
export function waitingForChosenTrainLive(
  trip: SavedTrip | null | undefined,
  allTrains: LiveTrain[],
): boolean {
  if (!trip?.chosenDeparture) return false;
  const trackingTrainId = trackingTrainIdForTrip(trip);
  return resolveTrackedTrain(allTrains, trackingTrainId, trip) == null;
}
