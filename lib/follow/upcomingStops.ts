import type { LiveTrain, UpcomingStop } from "@/types";
import { indexOfStopName } from "./stopNames";

export type { UpcomingStop };

const MAX_UPCOMING = 8;

export function trimUpcomingThroughStop(
  stops: UpcomingStop[],
  orderedStops: string[],
  throughStopName: string | null | undefined,
): UpcomingStop[] {
  if (!throughStopName?.trim() || orderedStops.length === 0) return stops;
  const throughIdx = indexOfStopName(orderedStops, throughStopName);
  if (throughIdx < 0) return stops;

  const out: UpcomingStop[] = [];
  for (const stop of stops) {
    const idx = indexOfStopName(orderedStops, stop.name);
    if (idx >= 0 && idx > throughIdx) break;
    out.push(stop);
    if (idx === throughIdx) break;
  }
  return out;
}

export function upcomingStopsForTrain(
  train: LiveTrain,
  orderedStops: string[],
  opts?: { throughStopName?: string | null },
): UpcomingStop[] {
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
  if (start < 0 && train.label?.trim()) {
    start = indexOfStopName(orderedStops, train.label);
  }
  if (start < 0 && train.atStation) {
    start = 0;
  }
  if (start < 0) {
    start = 0;
  }

  const slice = orderedStops.slice(start, start + MAX_UPCOMING);
  let mapped = slice.map((name, i) => ({
    name,
    kind: i === 0 ? (train.atStation ? "at" : "next") : ("upcoming" as const),
  }));

  if (opts?.throughStopName) {
    mapped = trimUpcomingThroughStop(mapped, orderedStops, opts.throughStopName);
  }

  return mapped;
}
