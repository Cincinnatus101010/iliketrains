import { indexOfStopName } from "@/lib/follow/stopNames";
import type { UpcomingStop } from "@/types";

const MAX_STOPS = 8;

export function upcomingStopsAlongBoardingApproach(
  orderedStops: string[],
  boardingStationName: string,
  _boardingStationDestination: string | null | undefined,
  approachFromHigh: boolean | null,
  approachProgress: number,
): UpcomingStop[] {
  if (orderedStops.length === 0) return [];

  const boardingIdx = indexOfStopName(orderedStops, boardingStationName);
  if (boardingIdx < 0) return [];

  let originIdx: number;
  if (approachFromHigh === true) {
    originIdx = orderedStops.length - 1;
  } else if (approachFromHigh === false) {
    originIdx = 0;
  } else {
    originIdx = boardingIdx > orderedStops.length / 2 ? 0 : orderedStops.length - 1;
  }

  const progress = Math.max(0, Math.min(1, approachProgress));
  const currentIdx = Math.round(originIdx + progress * (boardingIdx - originIdx));
  const low = Math.min(currentIdx, boardingIdx);
  const high = Math.max(currentIdx, boardingIdx);

  let slice = orderedStops.slice(low, high + 1);
  if (slice.length > MAX_STOPS) {
    slice = slice.slice(-MAX_STOPS);
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
