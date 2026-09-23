import { type LineKey, lineKey, parseLineKey, trainMatchesLineKey } from "@/lib/lineKey";
import type { LiveTrain, RouteStep } from "@/types";
import type { SavedTrip } from "./savedTrip";

export function rideLineKeysFromTrip(trip: SavedTrip): LineKey[] {
  const keys = new Set<LineKey>();
  for (const step of trip.route.steps) {
    if (step.kind !== "ride" || !step.route) continue;
    const network = stepNetwork(step, trip);
    if (!network) continue;
    keys.add(lineKey(network, step.route));
  }
  return [...keys];
}

function stepNetwork(step: RouteStep, trip: SavedTrip): "mta" | "njt" | null {
  if (step.network === "mta" || step.network === "njt") return step.network;
  const from = parseLineKey(trip.fromKey);
  if (from) return from.network;
  return null;
}

export function trainMatchesTrip(train: LiveTrain, trip: SavedTrip): boolean {
  for (const step of trip.route.steps) {
    if (step.kind !== "ride" || !step.route) continue;
    const network = stepNetwork(step, trip);
    if (network) {
      if (train.network === network && train.route.toUpperCase() === step.route.toUpperCase()) {
        return true;
      }
      continue;
    }
    if (train.route.toUpperCase() === step.route.toUpperCase()) return true;
  }
  return false;
}

export function trainMatchesTripOrLine(
  train: LiveTrain,
  trip: SavedTrip | null,
  activeLine: LineKey | null,
): boolean {
  if (activeLine && !trainMatchesLineKey(train, activeLine)) return false;
  if (!trip) return true;
  return trainMatchesTrip(train, trip);
}

/** NJ station code from a graph node key like `njt:NP`, when present. */
export function njStationCodeFromTripKey(stationKey: string): string | null {
  const parsed = parseLineKey(stationKey);
  if (parsed?.network !== "njt") return null;
  return parsed.route;
}
