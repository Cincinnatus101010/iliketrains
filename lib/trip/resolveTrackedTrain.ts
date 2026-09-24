import {
  findLiveTrainForChosenDeparture,
  findNjTrainByFollowId,
} from "@/lib/trip/chosenDepartureLiveMatch";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { LiveTrain } from "@/types";

/** Single definition of “this tracked train is in the merged live feed”. */
export function resolveTrackedTrain(
  allTrains: LiveTrain[],
  trackingTrainId: string | null,
  savedTrip: SavedTrip | null = null,
): LiveTrain | null {
  if (!trackingTrainId) return null;
  if (savedTrip?.chosenDeparture) {
    const fromDeparture = findLiveTrainForChosenDeparture(savedTrip, allTrains);
    if (fromDeparture) return fromDeparture;
  }
  return (
    findNjTrainByFollowId(trackingTrainId, allTrains) ??
    allTrains.find((t) => t.id === trackingTrainId) ??
    null
  );
}
