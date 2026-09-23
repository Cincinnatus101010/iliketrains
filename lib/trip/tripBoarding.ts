import type { PlannedRoute, TripBoardingContext } from "@/types";
import { firstRideStep } from "./firstRideStep";

export type { TripBoardingContext };

export function walkMinutesBeforeFirstRide(route: PlannedRoute): number {
  let mins = 0;
  for (const step of route.steps) {
    if (step.kind === "ride" && step.route) break;
    if (step.kind === "walk") mins += step.walkMinutes ?? 0;
  }
  return mins;
}

/** Where the first train is boarded (may differ from the trip “from” after a walk leg). */
export function tripBoardingContext(
  route: PlannedRoute,
  tripOriginName: string,
): TripBoardingContext | null {
  const first = firstRideStep(route);
  if (!first?.fromKey) return null;
  return {
    stationKey: first.fromKey,
    stationName: first.fromName,
    walkMinutes: walkMinutesBeforeFirstRide(route),
    tripOriginName,
  };
}
