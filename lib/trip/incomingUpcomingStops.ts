import { indexOfStopName } from "@/lib/follow/stopNames";
import type { UpcomingStop } from "@/types";

const MAX_STOPS = 8;

/**
 * Stops from the train’s estimated timetable position through the boarding stop,
 * along the line’s milepost order.
 */
export function upcomingStopsAlongBoardingApproach(
  orderedStops: string[],
  boardingStationName: string,
  trainDestination: string | null | undefined,
  approachFromHigh: boolean | null,
  approachProgress: number,
): UpcomingStop[] {
  if (orderedStops.length === 0) return [];

  const boardingIdx = indexOfStopName(orderedStops, boardingStationName);
  if (boardingIdx < 0) return [];

  let originIdx = approachFromHigh ? 0 : orderedStops.length - 1;
  const destRaw = trainDestination?.trim();
  if (destRaw) {
    const destIdx = indexOfStopName(orderedStops, destRaw);
    if (destIdx >= 0) originIdx = destIdx;
  }

  const progress = Math.max(0, Math.min(1, approachProgress));
  const currentIdx = Math.round(originIdx + progress * (boardingIdx - originIdx));
  const low = Math.min(currentIdx, boardingIdx);
  const high = Math.max(currentIdx, boardingIdx);

  let slice = orderedStops.slice(low, high + 1);
  if (slice.length > MAX_STOPS) {
    slice = slice.slice(slice.length - MAX_STOPS);
  }

  return slice.map((name, i) => {
    const atBoarding = indexOfStopName([name], boardingStationName) >= 0;
    const isFirst = i === 0;
    let kind: UpcomingStop["kind"] = "upcoming";
    if (atBoarding && progress >= 0.92) kind = "at";
    else if (isFirst) kind = "next";
    else if (atBoarding) kind = "next";
    return { name, kind };
  });
}
