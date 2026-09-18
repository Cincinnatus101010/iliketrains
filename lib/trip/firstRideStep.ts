import type { PlannedRoute, RouteStep } from "./types";

export function firstRideStep(route: PlannedRoute): RouteStep | null {
  return route.steps.find((s) => s.kind === "ride" && s.route) ?? null;
}
