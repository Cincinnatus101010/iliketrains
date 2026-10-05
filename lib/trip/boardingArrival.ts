import { indexOfStopName, stopNamesMatch } from "@/lib/follow/stopNames";
import { approachFromHighDist } from "@/lib/trip/incomingTrainDirection";
import type { LiveTrain } from "@/types";

export function isAtBoardingStop(train: LiveTrain, boardingStationName: string): boolean {
  if (!train.stopName?.trim()) return false;
  return stopNamesMatch(train.stopName, boardingStationName) && Boolean(train.atStation);
}

type EnRouteToBoardingOpts = {
  orderedStops?: string[];
  trainDestination?: string | null;
  /** Set once live GPS reports the train at the boarding platform. */
  hasVisitedBoarding?: boolean;
};

/** Live GPS: train is still approaching the boarding stop (not past it on the line). */
export function isEnRouteToBoarding(
  train: LiveTrain,
  boardingStationName: string,
  opts?: EnRouteToBoardingOpts,
): boolean {
  if (opts?.hasVisitedBoarding) return false;
  if (isAtBoardingStop(train, boardingStationName)) return false;

  if (train.stopName?.trim() && stopNamesMatch(train.stopName, boardingStationName)) {
    return true;
  }

  const ordered = opts?.orderedStops;
  if (ordered?.length) {
    const boardingIdx = indexOfStopName(ordered, boardingStationName);
    const currentIdx = indexOfStopName(ordered, train.stopName);
    const destIdx = opts?.trainDestination ? indexOfStopName(ordered, opts.trainDestination) : -1;
    if (boardingIdx >= 0 && currentIdx >= 0) {
      const fromHigh = approachFromHighDist(ordered, boardingStationName, opts.trainDestination);
      if (fromHigh === true) {
        // Terminal is on the low-index side; inbound to boarding moves toward higher indices.
        if (currentIdx > boardingIdx) return true;
        if (currentIdx < boardingIdx && destIdx >= 0 && currentIdx > destIdx) return true;
        return false;
      }
      if (fromHigh === false) {
        if (currentIdx < boardingIdx) return true;
        if (currentIdx > boardingIdx && destIdx >= 0 && currentIdx < destIdx) return true;
        return false;
      }
    }
  }

  return false;
}
