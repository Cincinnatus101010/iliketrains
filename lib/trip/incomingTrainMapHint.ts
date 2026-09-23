import { canonicalNjRoute } from "@/lib/nj/njRoutes";
import { formatMinutesUntilBoarding } from "./chosenDepartureEta";
import {
  boardingLonLat,
  estimateIncomingLngLat,
  incomingApproachProgress,
} from "./incomingTrainEstimate";
import type { SavedTrip } from "./savedTrip";
import { liveTrainIdForChosenDeparture } from "./tracking";
import { tripBoardingContext } from "./tripBoarding";

export type IncomingTrainMapHint = {
  trainId: string;
  longitude: number;
  latitude: number;
  route: string;
  network: "njt" | "mta";
  label: string;
  lineName: string;
  boardingStationName: string;
  minutesUntilLabel: string;
  track: string | null;
  boardingLonLat: [number, number];
  approachProgress: number;
};

export function incomingTrainMapHint(
  trip: SavedTrip,
  nowMs = Date.now(),
): IncomingTrainMapHint | null {
  const dep = trip.chosenDeparture;
  if (!dep) return null;

  const trainId = liveTrainIdForChosenDeparture(trip);
  if (!trainId) return null;

  const boardingCoord = boardingLonLat(trip);
  const lngLat = estimateIncomingLngLat(trip, dep, nowMs);
  if (!lngLat || !boardingCoord) return null;

  const boarding = tripBoardingContext(trip.route, trip.fromName)?.stationName ?? trip.fromName;

  const firstRide = trip.route.steps.find((s) => s.kind === "ride" && s.route);
  const network = firstRide?.network === "mta" ? "mta" : "njt";
  const trackRoute =
    canonicalNjRoute(dep.lineCode ?? dep.lineAbbrev ?? dep.line) ??
    canonicalNjRoute(firstRide?.route ?? null) ??
    "";

  return {
    trainId,
    longitude: lngLat[0],
    latitude: lngLat[1],
    route: trackRoute,
    network,
    label: dep.trainId,
    lineName: dep.line || dep.lineAbbrev,
    boardingStationName: boarding,
    minutesUntilLabel: formatMinutesUntilBoarding(dep, nowMs),
    track: dep.track,
    boardingLonLat: boardingCoord,
    approachProgress: incomingApproachProgress(dep, nowMs),
  };
}
