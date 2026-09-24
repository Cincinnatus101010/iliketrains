import type { LiveTrain } from "@/types";
import { findLiveTrainForChosenDeparture } from "./chosenDepartureLiveMatch";
import type { SavedTrip } from "./savedTrip";

/** Chosen schedule departure is set but that train is not in the merged live feed yet. */
export function waitingForChosenTrainLive(
  trip: SavedTrip | null | undefined,
  allTrains: LiveTrain[],
): boolean {
  if (!trip?.chosenDeparture) return false;
  return findLiveTrainForChosenDeparture(trip, allTrains) == null;
}
