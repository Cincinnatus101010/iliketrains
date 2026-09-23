import { parseLineKey } from "@/lib/lineKey";
import { sortUniqueDepartureRows } from "@/lib/nj/dedupeDepartures";
import { getScheduleResponse } from "@/lib/nj/getSchedule";
import { itemMatchesRoute } from "@/lib/nj/stationSchedule";
import type { NjStation, PlannedRoute, ScheduleDeparture, TripBoardingSchedule } from "@/types";
import { boardingScheduleLineCodes } from "./boardingLines";
import { filterDeparturesAfterArrival, filterDeparturesTowardTrip } from "./filterDepartures";
import { firstRideStep } from "./firstRideStep";
import { resolveNjStationCodeForTrip } from "./resolveNjStation";
import { tripBoardingContext } from "./tripBoarding";

/** Upcoming trains at the first boarding stop that serve this trip (time + track). */
export async function boardingDeparturesForRoute(
  route: PlannedRoute,
  tripOriginName: string,
  stations: NjStation[],
): Promise<TripBoardingSchedule | null> {
  const boarding = tripBoardingContext(route, tripOriginName);
  const firstLeg = firstRideStep(route);
  const lineCode = firstLeg?.route?.trim() ?? "";
  if (!boarding || !lineCode) return null;

  const network = parseLineKey(boarding.stationKey)?.network;
  if (network !== "njt") {
    return {
      stationCode: null,
      stationName: boarding.stationName,
      lineCode,
      boarding,
      departures: [],
      scheduleError: null,
    };
  }

  const stationCode = resolveNjStationCodeForTrip(
    boarding.stationKey,
    boarding.stationName,
    stations,
  );
  if (!stationCode) {
    return {
      stationCode: null,
      stationName: boarding.stationName,
      lineCode,
      boarding,
      departures: [],
      scheduleError: "Could not match this stop to NJ schedule data.",
    };
  }

  const lineCodes = boardingScheduleLineCodes(route, boarding.stationKey);
  const schedule = await mergedScheduleForBoarding(stationCode, lineCodes);
  const departures = departuresForBoarding(schedule.items, route, lineCodes, boarding.walkMinutes);

  return {
    stationCode,
    stationName: schedule.stationName || boarding.stationName,
    lineCode,
    boarding,
    departures,
    scheduleError: schedule.error,
  };
}

async function mergedScheduleForBoarding(
  stationCode: string,
  lineCodes: string[],
): Promise<{ items: ScheduleDeparture[]; stationName: string; error: string | null }> {
  const byKey = new Map<string, ScheduleDeparture>();
  let stationName = "";
  let error: string | null = null;

  for (const line of lineCodes) {
    const res = await getScheduleResponse(stationCode, line);
    if (res.stationName) stationName = res.stationName;
    if (res.error) error = res.error;
    for (const item of res.items) {
      byKey.set(`${item.trainId}-${item.scheduledAt}`, item);
    }
  }

  if (byKey.size === 0) {
    const all = await getScheduleResponse(stationCode, null);
    stationName = all.stationName || stationName;
    error = all.error ?? error;
    for (const item of all.items) {
      byKey.set(`${item.trainId}-${item.scheduledAt}`, item);
    }
  }

  return { items: [...byKey.values()], stationName, error };
}

export function departuresForBoarding(
  items: ScheduleDeparture[],
  route: PlannedRoute,
  lineCodes: string[],
  walkMinutes: number,
  nowMs = Date.now(),
): ScheduleDeparture[] {
  const onLines = items.filter((item) => lineCodes.some((code) => itemMatchesRoute(item, code)));
  let towardTrip = filterDeparturesTowardTrip(onLines, route);
  if (towardTrip.length === 0 && onLines.length > 0) {
    towardTrip = onLines;
  }
  const afterArrival = filterDeparturesAfterArrival(towardTrip, walkMinutes, nowMs);
  return sortUniqueDepartureRows(afterArrival);
}
