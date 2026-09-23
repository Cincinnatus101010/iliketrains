import type { PlannedRoute } from "@/types";
import { firstRideStep } from "./firstRideStep";

/** NJ line codes to query at the first boarding stop (e.g. BNTN + MNE at Hoboken). */
export function boardingScheduleLineCodes(
  route: PlannedRoute,
  boardingStationKey: string,
): string[] {
  const rides = route.steps.filter((s) => s.kind === "ride" && s.route);
  const codes = new Set<string>();

  for (const step of rides) {
    if (step.fromKey === boardingStationKey) codes.add(step.route!);
  }

  const first = firstRideStep(route);
  // Major hubs: later legs on other lines often depart from the same origin (Hoboken → MNE or BNTN).
  if (first?.fromKey === boardingStationKey) {
    for (const step of rides) {
      if (step.fromKey !== boardingStationKey) codes.add(step.route!);
    }
  }

  return [...codes];
}
