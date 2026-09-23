import type { PlannedRoute } from "@/types";
import { firstRideStep } from "./firstRideStep";

/** Trip origins where multiple lines share departures (avoid querying transfer-only lines elsewhere). */
const MULTI_LINE_BOARDING_HUBS = new Set(["njt:63"]);

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
  if (first?.fromKey === boardingStationKey && MULTI_LINE_BOARDING_HUBS.has(boardingStationKey)) {
    for (const step of rides) {
      codes.add(step.route!);
    }
  }

  return [...codes];
}
