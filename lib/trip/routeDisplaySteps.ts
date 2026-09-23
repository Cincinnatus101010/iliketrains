import type { RouteStep } from "@/types";

/** Insert explicit transfer steps between consecutive train rides for the timeline UI. */
export function routeStepsForDisplay(steps: RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const prev = i > 0 ? steps[i - 1]! : null;

    if (prev?.kind === "ride" && step.kind === "ride") {
      out.push({
        kind: "walk",
        route: null,
        fromName: prev.toName,
        toName: step.fromName,
        color: null,
        fromKey: prev.toKey,
        toKey: step.fromKey,
        walkMinutes:
          prev.toName.trim().toLowerCase() === step.fromName.trim().toLowerCase() ? 0 : undefined,
      });
    }

    out.push(step);
  }

  return out;
}

/** Stops where the rider changes trains (end of each ride except the last). */
export function tripTransferStopNames(steps: RouteStep[]): string[] {
  const rides = steps.filter((s) => s.kind === "ride" && s.route);
  if (rides.length <= 1) return [];
  return rides.slice(0, -1).map((s) => s.toName);
}
