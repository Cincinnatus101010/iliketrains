import { tripLineLabel } from "./lineLabel";
import { tripTransferStopNames } from "./routeDisplaySteps";
import type { PlannedRoute, RouteStep, TripStats, TripStatsLine } from "./types";

export function buildTripStats(steps: RouteStep[], stopCount: number): TripStats {
  let rideCount = 0;
  let walkCount = 0;
  let totalWalkM = 0;
  let totalWalkMin = 0;
  const lineMap = new Map<string, TripStatsLine>();

  for (const step of steps) {
    if (step.kind === "ride" && step.route) {
      rideCount += 1;
      const network = step.network ?? "mta";
      const key = `${network}:${step.route}`;
      if (!lineMap.has(key)) {
        lineMap.set(key, {
          network,
          route: step.route,
          label: tripLineLabel(network, step.route),
        });
      }
    }
    if (step.kind === "walk") {
      walkCount += 1;
      totalWalkM += step.walkDistanceM ?? 0;
      totalWalkMin += step.walkMinutes ?? 0;
    }
  }

  const railTransfers = Math.max(0, rideCount - 1);

  return {
    rideCount,
    walkCount,
    transferCount: railTransfers,
    stationCount: stopCount,
    totalWalkM,
    totalWalkMin,
    lines: [...lineMap.values()],
  };
}

/** “Direct” or where to change trains for this plan. */
export function tripConnectionLabel(route: PlannedRoute): string {
  const transferStops = tripTransferStopNames(route.steps);
  if (transferStops.length === 0) return "Direct";
  if (transferStops.length === 1) return `Transfer at ${transferStops[0]}`;
  return `${transferStops.length} transfers · ${transferStops.join(", ")}`;
}

export function tripStatsHeadline(stats: TripStats): string {
  const parts: string[] = [];
  if (stats.rideCount > 0) {
    parts.push(`${stats.rideCount} ride${stats.rideCount === 1 ? "" : "s"}`);
  }
  if (stats.transferCount > 0) {
    parts.push(`${stats.transferCount} transfer${stats.transferCount === 1 ? "" : "s"}`);
  }
  if (stats.totalWalkMin > 0) {
    parts.push(`~${stats.totalWalkMin} min walk`);
  }
  parts.push(`${stats.stationCount} stop${stats.stationCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function ensureRouteStats(route: PlannedRoute): PlannedRoute {
  if (route.stats) return route;
  return { ...route, stats: buildTripStats(route.steps, route.stopCount) };
}
