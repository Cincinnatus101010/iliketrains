import { resolveTrackedTrain } from "@/lib/trip/resolveTrackedTrain";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { trackingTrainIdForTrip } from "@/lib/trip/tracking";
import type { LiveTrain } from "@/types";

const STALE_FOLLOW_ERROR = /not in live feed/i;

export function trainResolvedInMergedFeed(
  trackingTrainId: string | null,
  allTrains: LiveTrain[],
  savedTrip: SavedTrip | null = null,
): LiveTrain | null {
  const id = trackingTrainId ?? (savedTrip ? trackingTrainIdForTrip(savedTrip) : null);
  if (!id && !savedTrip?.chosenDeparture) return null;
  return resolveTrackedTrain(allTrains, id, savedTrip);
}

/** Follow poll can miss while the same vehicle is already in the bulk NJ feed. */
export function filterStaleFollowFeedErrors(
  apiErrors: string[],
  trackingTrainId: string | null,
  allTrains: LiveTrain[],
  savedTrip: SavedTrip | null = null,
): string[] {
  if (!trainResolvedInMergedFeed(trackingTrainId, allTrains, savedTrip)) return apiErrors;
  return apiErrors.filter((message) => !STALE_FOLLOW_ERROR.test(message));
}
