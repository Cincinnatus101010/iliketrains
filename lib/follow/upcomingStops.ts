import type { LiveTrain, UpcomingStop } from "@/types";
import { indexOfStopName } from "./stopNames";

export type { UpcomingStop };

const MAX_UPCOMING = 8;

export function upcomingStopsForTrain(train: LiveTrain, orderedStops: string[]): UpcomingStop[] {
  if (orderedStops.length === 0) {
    if (!train.stopName?.trim()) return [];
    return [
      {
        name: train.stopName,
        kind: train.atStation ? "at" : "next",
      },
    ];
  }

  let start = indexOfStopName(orderedStops, train.stopName);
  if (start < 0 && train.atStation) {
    start = 0;
  }
  if (start < 0) {
    start = 0;
  }

  const slice = orderedStops.slice(start, start + MAX_UPCOMING);
  return slice.map((name, i) => ({
    name,
    kind: i === 0 ? (train.atStation ? "at" : "next") : ("upcoming" as const),
  }));
}
