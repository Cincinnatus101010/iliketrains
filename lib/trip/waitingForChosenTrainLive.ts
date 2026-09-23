import type { LiveTrain } from "@/types";
import type { SavedTrip } from "./savedTrip";
import { liveTrainIdForChosenDeparture } from "./tracking";

/** Chosen schedule departure is set but that train is not in the merged live feed yet. */
export function waitingForChosenTrainLive(
  trip: SavedTrip | null | undefined,
  allTrains: LiveTrain[],
): boolean {
  if (!trip?.chosenDeparture) return false;
  const id = liveTrainIdForChosenDeparture(trip);
  if (!id) return false;
  return !allTrains.some((t) => t.id === id);
}
