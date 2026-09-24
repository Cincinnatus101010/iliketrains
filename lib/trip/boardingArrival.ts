import { stopNamesMatch } from "@/lib/follow/stopNames";
import type { LiveTrain } from "@/types";

export function isAtBoardingStop(train: LiveTrain, boardingStationName: string): boolean {
  if (!train.stopName?.trim()) return false;
  return stopNamesMatch(train.stopName, boardingStationName) && Boolean(train.atStation);
}

/** Live GPS is reporting the train, but it has not reached the boarding stop yet. */
export function isEnRouteToBoarding(train: LiveTrain, boardingStationName: string): boolean {
  return !isAtBoardingStop(train, boardingStationName);
}
