import { loadTripGraph, type TripGraph } from "@/lib/trip/loadGraph";
import type { LiveTrain, Network } from "@/types";
import { sortStopsAlongCoords } from "./trackProject";

const routeStopsCache = new Map<string, string[]>();
const njTrackCoords = new Map<string, [number, number][]>();
let njTracksLoaded: Promise<void> | null = null;

async function ensureNjTrackCoords(): Promise<void> {
  if (njTrackCoords.size > 0) return;
  if (njTracksLoaded) return njTracksLoaded;
  njTracksLoaded = (async () => {
    try {
      const res = await fetch("/data/nj-rail-tracks.geojson");
      if (!res.ok) return;
      const data = (await res.json()) as {
        features?: Array<{
          properties?: { route?: string };
          geometry?: { coordinates?: [number, number][] };
        }>;
      };
      for (const feat of data.features ?? []) {
        const route = feat.properties?.route?.trim().toUpperCase();
        const coords = feat.geometry?.coordinates;
        if (route && coords && coords.length >= 2) {
          njTrackCoords.set(route, coords);
        }
      }
    } catch {
      /* ignore */
    }
  })();
  return njTracksLoaded;
}

function nodesOnRoute(
  graph: TripGraph,
  route: string,
  network: Network,
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
    if (!key.startsWith(`${network}:`)) continue;
    const node = graph.nodes.get(key);
    if (!node) continue;
    stops.push({ name: node.name, lat: node.lat, lon: node.lon });
  }
  return stops;
}

function orderMtaFromCurrent(
  graph: TripGraph,
  route: string,
  fromStopId: string | null | undefined,
): string[] {
  const routeU = route.toUpperCase();
  let startKey: string | null = null;
  if (fromStopId?.trim()) {
    const direct = `mta:${fromStopId.trim()}`;
    if (graph.nodes.has(direct)) startKey = direct;
  }

  if (!startKey) {
    return nodesOnRoute(graph, route, "mta")
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b));
  }

  const order: string[] = [];
  const seen = new Set<string>([startKey]);
  let frontier = [startKey];

  while (frontier.length > 0 && order.length < 40) {
    const next: string[] = [];
    for (const nodeKey of frontier) {
      const node = graph.nodes.get(nodeKey);
      if (node) order.push(node.name);
      const edges = graph.adjacency.get(nodeKey) ?? [];
      for (const e of edges) {
        if (e.route.toUpperCase() !== routeU) continue;
        const other = e.from === nodeKey ? e.to : e.from;
        if (seen.has(other)) continue;
        seen.add(other);
        next.push(other);
      }
    }
    frontier = next;
  }

  return order;
}

async function loadOrderedStops(train: LiveTrain): Promise<string[]> {
  const cacheKey = `${train.network}:${train.route}:${train.anchorStopId ?? train.stopId ?? ""}`;
  const hit = routeStopsCache.get(cacheKey);
  if (hit) return hit;

  const graph = await loadTripGraph();
  if (!graph) return [];

  let names: string[] = [];
  if (train.network === "njt") {
    await ensureNjTrackCoords();
    const stops = nodesOnRoute(graph, train.route, "njt");
    const coords = njTrackCoords.get(train.route.toUpperCase());
    names = coords ? sortStopsAlongCoords(stops, coords) : stops.map((s) => s.name).sort();
  } else {
    names = orderMtaFromCurrent(graph, train.route, train.anchorStopId ?? train.stopId);
  }

  routeStopsCache.set(cacheKey, names);
  return names;
}

export async function getOrderedStopsForTrain(train: LiveTrain): Promise<string[]> {
  return loadOrderedStops(train);
}
