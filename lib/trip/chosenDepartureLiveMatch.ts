import { routeFromApiLine } from "@/lib/nj/njRoutes";
import { normalizeNjTrainId } from "@/lib/nj/normalizeTrainId";
import { itemMatchesRoute } from "@/lib/nj/stationSchedule";
import type { LiveTrain, ScheduleDeparture } from "@/types";
import type { SavedTrip } from "./savedTrip";
import { liveTrainIdForChosenDeparture } from "./tracking";

export { normalizeNjTrainId } from "@/lib/nj/normalizeTrainId";

/** Resolve a follow/tracking id (e.g. njt-6644) against NJ vehicles in a feed snapshot. */
export function findNjTrainByFollowId(trainId: string, trains: LiveTrain[]): LiveTrain | null {
  const id = trainId.trim();
  if (!id) return null;

  const exact = trains.find((t) => t.id === id);
  if (exact) return exact;

  const rawNum = id.replace(/^njt-/i, "").trim();
  if (!rawNum) return null;

  for (const train of trains) {
    if (train.network !== "njt") continue;
    if (njTrainIdsMatch(rawNum, train)) return train;
  }
  return null;
}

export function scheduleLineMatchesLiveTrain(dep: ScheduleDeparture, train: LiveTrain): boolean {
  if (itemMatchesRoute(dep, train.route)) return true;
  const fromLiveLine = routeFromApiLine(train.lineName);
  if (fromLiveLine && itemMatchesRoute(dep, fromLiveLine)) return true;
  return false;
}

export function njTrainIdsMatch(scheduleTrainId: string, live: LiveTrain): boolean {
  const want = normalizeNjTrainId(scheduleTrainId);
  if (!want) return false;
  if (live.trainNumber && normalizeNjTrainId(live.trainNumber) === want) return true;
  const fromLiveId = live.id.match(/^njt-(.+)$/i)?.[1];
  if (fromLiveId && normalizeNjTrainId(fromLiveId) === want) return true;
  return normalizeNjTrainId(live.id) === want;
}

/** Match chosen schedule row to a vehicle in the merged live feed (exact id or train number + line). */
export function findLiveTrainForChosenDeparture(
  trip: SavedTrip,
  allTrains: LiveTrain[],
): LiveTrain | null {
  const dep = trip.chosenDeparture;
  if (!dep) return null;

  const trainId = dep.trainId?.trim();
  if (!trainId) return null;

  const expectedId = liveTrainIdForChosenDeparture(trip);
  if (expectedId) {
    const byFollowId = findNjTrainByFollowId(expectedId, allTrains);
    if (byFollowId) return byFollowId;
  }

  for (const train of allTrains) {
    if (train.network !== "njt") continue;
    if (!njTrainIdsMatch(trainId, train)) continue;
    if (!scheduleLineMatchesLiveTrain(dep, train)) continue;
    return train;
  }

  for (const train of allTrains) {
    if (train.network !== "njt") continue;
    if (njTrainIdsMatch(trainId, train)) return train;
  }

  return null;
}
