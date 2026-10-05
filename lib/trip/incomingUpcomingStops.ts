import type { UpcomingStop } from "@/app/types";
import { indexOfStopName } from "@/lib/follow/stopNames";

const MAX_STOPS = 8;

/** Stop list aligned with map milepost logic in `lngLatForIncomingOnTrack`. */
export function upcomingStopsAlongBoardingApproach(
  orderedStops: string[],
  boardingStationName: string,
  _trainDestination: string | null | undefined,
  approachFromHigh: boolean | null,
  approachProgress: number,
): UpcomingStop[] {
  if (orderedStops.length === 0) return [];

  const boardingIdx = indexOfStopName(orderedStops, boardingStationName);
  if (boardingIdx < 0) return [];

  const progress = Math.max(0, Math.min(1, approachProgress));
  let slice: string[];

  if (approachFromHigh === true) {
    const farIdx = Math.min(orderedStops.length - 1, boardingIdx + MAX_STOPS);
    const currentIdx = Math.round(boardingIdx + (1 - progress) * (farIdx - boardingIdx));
    if (currentIdx <= boardingIdx) {
      slice = [orderedStops[boardingIdx]!];
    } else {
      slice = orderedStops.slice(boardingIdx + 1, currentIdx + 1);
      slice.push(orderedStops[boardingIdx]!);
    }
  } else if (approachFromHigh === false) {
    const farIdx = Math.max(0, boardingIdx - MAX_STOPS);
    const currentIdx = Math.round(boardingIdx - (1 - progress) * (boardingIdx - farIdx));
    if (currentIdx >= boardingIdx) {
      slice = [orderedStops[boardingIdx]!];
    } else {
      slice = orderedStops.slice(currentIdx, boardingIdx + 1);
    }
  } else {
    const originIdx = boardingIdx > orderedStops.length / 2 ? 0 : orderedStops.length - 1;
    const currentIdx = Math.round(originIdx + progress * (boardingIdx - originIdx));
    const low = Math.min(currentIdx, boardingIdx);
    const high = Math.max(currentIdx, boardingIdx);
    slice = orderedStops.slice(low, high + 1);
    if (slice.length > MAX_STOPS) slice = slice.slice(-MAX_STOPS);
  }

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
