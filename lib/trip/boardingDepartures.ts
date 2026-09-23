import { parseLineKey } from "@/lib/lineKey";
import { sortUniqueDepartureRows } from "@/lib/nj/dedupeDepartures";
import { getScheduleResponse } from "@/lib/nj/getSchedule";
import { itemMatchesRoute } from "@/lib/nj/stationSchedule";
import type { NjStation, PlannedRoute, ScheduleDeparture, TripBoardingSchedule } from "@/types";
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

  let schedule = await getScheduleResponse(stationCode, lineCode);
  if (schedule.items.length === 0) {
    schedule = await getScheduleResponse(stationCode, null);
  }
  const departures = departuresForBoarding(schedule.items, route, lineCode, boarding.walkMinutes);

  return {
    stationCode,
    stationName: schedule.stationName || boarding.stationName,
    lineCode,
    boarding,
    departures,
    scheduleError: schedule.error,
  };
}

export function departuresForBoarding(
  items: ScheduleDeparture[],
  route: PlannedRoute,
  lineCode: string,
  walkMinutes: number,
  nowMs = Date.now(),
): ScheduleDeparture[] {
  const onLine = items.filter((item) => itemMatchesRoute(item, lineCode));
  let towardTrip = filterDeparturesTowardTrip(onLine, route);
  if (towardTrip.length === 0 && onLine.length > 0) {
    towardTrip = onLine;
  }
  const afterArrival = filterDeparturesAfterArrival(towardTrip, walkMinutes, nowMs);
  return sortUniqueDepartureRows(afterArrival);
}
