import { sortStopsAlongCoords } from "@/lib/follow/trackProject";
import type { TripGraph } from "@/types";

function normalizeStopName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&]/g, "");
}

function findStopIndex(stops: string[], stationName: string): number {
  const want = normalizeStopName(stationName);
  if (!want) return -1;

  let idx = stops.findIndex((s) => normalizeStopName(s) === want);
  if (idx >= 0) return idx;

  idx = stops.findIndex((s) => {
    const n = normalizeStopName(s);
    return n.includes(want) || want.includes(n);
  });
  return idx;
}

function nodesOnRoute(
  graph: TripGraph,
  route: string,
): { name: string; lat: number; lon: number }[] {
  const routeU = route.toUpperCase();
  const keys = new Set<string>();
  for (const edges of graph.adjacency.values()) {
    for (const e of edges) {
      if (e.route.toUpperCase() !== routeU) continue;
      keys.add(e.from);
      keys.add(e.to);
    }
  }

  const stops: { name: string; lat: number; lon: number }[] = [];
  for (const key of keys) {
    if (!key.startsWith("njt:")) continue;
    const node = graph.nodes.get(key);
    if (!node) continue;
    stops.push({ name: node.name, lat: node.lat, lon: node.lon });
  }
  return stops;
}

export function orderedStopsOnNjRoute(
  graph: TripGraph,
  routeId: string,
  trackCoords: [number, number][] | null,
): string[] {
  const stops = nodesOnRoute(graph, routeId);
  if (trackCoords && trackCoords.length >= 2) {
    return sortStopsAlongCoords(stops, trackCoords);
  }
  return stops.map((s) => s.name).sort((a, b) => a.localeCompare(b));
}

/**
 * When true, the train approaches boarding from higher milepost (after boarding on the line).
 * When false, from lower milepost. Null if direction cannot be inferred.
 */
export function approachFromHighDist(
  stopOrder: string[],
  boardingStationName: string,
  trainDestination: string | null | undefined,
): boolean | null {
  const boardingIdx = findStopIndex(stopOrder, boardingStationName);
  if (boardingIdx < 0) return null;

  const destRaw = trainDestination?.trim();
  if (!destRaw) return null;

  const destIdx = findStopIndex(stopOrder, destRaw);
  if (destIdx < 0 || destIdx === boardingIdx) return null;

  return destIdx < boardingIdx;
}
