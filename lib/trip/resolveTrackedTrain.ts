import {
  findLiveTrainForChosenDeparture,
  findNjTrainByFollowId,
} from "@/lib/trip/chosenDepartureLiveMatch";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { liveTrainIdForChosenDeparture } from "@/lib/trip/tracking";
import type { LiveTrain } from "@/types";

function resolveByTrackingId(allTrains: LiveTrain[], trackingTrainId: string): LiveTrain | null {
  return (
    findNjTrainByFollowId(trackingTrainId, allTrains) ??
    allTrains.find((t) => t.id === trackingTrainId) ??
    null
  );
}

/** Single definition of “this tracked train is in the merged live feed”. */
export function resolveTrackedTrain(
  allTrains: LiveTrain[],
  trackingTrainId: string | null,
  savedTrip: SavedTrip | null = null,
): LiveTrain | null {
  if (!trackingTrainId) return null;

  const manualFollow =
    savedTrip?.tracking?.mode === "train" && savedTrip.tracking.trainId.trim() === trackingTrainId;

  if (manualFollow) {
    return resolveByTrackingId(allTrains, trackingTrainId);
  }

  if (savedTrip?.chosenDeparture && savedTrip.tracking?.mode !== "train") {
    const fromDeparture = findLiveTrainForChosenDeparture(savedTrip, allTrains);
    if (fromDeparture) return fromDeparture;
  }

  // Auto / default: still prefer explicit tracking id over departure when ids differ
  const byId = resolveByTrackingId(allTrains, trackingTrainId);
  if (byId) return byId;

  if (savedTrip?.chosenDeparture) {
    const departureId = liveTrainIdForChosenDeparture(savedTrip);
    if (departureId && departureId !== trackingTrainId) {
      return findLiveTrainForChosenDeparture(savedTrip, allTrains);
    }
  }

  return null;
}
