import { canonicalNjRoute } from "@/lib/nj/njRoutes";
import type { LiveTrain } from "@/types";
import type { SavedTrip } from "./savedTrip";
import { liveTrainIdForChosenDeparture } from "./tracking";

export function normalizeNjTrainId(id: string): string {
  const trimmed = id.trim();
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num)) return String(num);
  return trimmed;
}

export function njTrainIdsMatch(scheduleTrainId: string, live: LiveTrain): boolean {
  const want = normalizeNjTrainId(scheduleTrainId);
  if (live.id === `njt-${want}` || live.id === want) return true;
  if (live.trainNumber && normalizeNjTrainId(live.trainNumber) === want) return true;
  return false;
}

/** Match chosen schedule row to a vehicle in the merged live feed (exact id or train number + line). */
export function findLiveTrainForChosenDeparture(
  trip: SavedTrip,
  allTrains: LiveTrain[],
): LiveTrain | null {
  const dep = trip.chosenDeparture;
  if (!dep) return null;

  const expectedId = liveTrainIdForChosenDeparture(trip);
  if (expectedId) {
    const exact = allTrains.find((t) => t.id === expectedId);
    if (exact) return exact;
  }

  const route = canonicalNjRoute(dep.lineCode ?? dep.lineAbbrev ?? dep.line);
  const trainId = dep.trainId?.trim();
  if (!trainId) return null;

  for (const train of allTrains) {
    if (train.network !== "njt") continue;
    if (!njTrainIdsMatch(trainId, train)) continue;
    if (route && train.route.toUpperCase() !== route) continue;
    return train;
  }

  for (const train of allTrains) {
    if (train.network !== "njt") continue;
    if (njTrainIdsMatch(trainId, train)) return train;
  }

  return null;
}
