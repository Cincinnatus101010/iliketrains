import { findLiveTrainForChosenDeparture } from "@/lib/trip/chosenDepartureLiveMatch";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { LiveTrain } from "@/types";

/** Map/trip boarding focus applies only when the followed vehicle is the chosen departure. */
export function isFollowingChosenDeparture(
  trip: SavedTrip,
  trackedTrain: LiveTrain | null,
  allTrains: LiveTrain[],
): boolean {
  if (!trip.chosenDeparture || !trackedTrain) return false;
  const chosen = findLiveTrainForChosenDeparture(trip, allTrains);
  return chosen != null && chosen.id === trackedTrain.id;
}
