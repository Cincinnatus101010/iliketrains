import { orderedStopsOnNjRoute } from "@/lib/trip/incomingTrainDirection";
import { loadTripGraph } from "@/lib/trip/loadGraph";

let njTrackCoordsCache: Map<string, [number, number][]> | null = null;
let njTracksInflight: Promise<Map<string, [number, number][]>> | null = null;

async function njTrackCoordsByRoute(): Promise<Map<string, [number, number][]>> {
  if (njTrackCoordsCache) return njTrackCoordsCache;
  if (njTracksInflight) return njTracksInflight;

  njTracksInflight = (async () => {
    const map = new Map<string, [number, number][]>();
    try {
      const res = await fetch("/data/nj-rail-tracks.geojson");
      if (res.ok) {
        const data = (await res.json()) as {
          features?: Array<{
            properties?: { route?: string };
            geometry?: { coordinates?: [number, number][] };
          }>;
        };
        for (const feat of data.features ?? []) {
          const route = feat.properties?.route?.trim().toUpperCase();
          const coords = feat.geometry?.coordinates;
          if (route && coords && coords.length >= 2) map.set(route, coords);
        }
      }
    } catch {
      /* ignore */
    }
    njTrackCoordsCache = map;
    return map;
  })();

  return njTracksInflight;
}

/** Milepost-ordered stop names for an NJ line (empty when geometry is unavailable). */
export async function loadNjRouteStopOrder(routeId: string): Promise<string[]> {
  const route = routeId.trim().toUpperCase();
  if (!route) return [];

  const graph = await loadTripGraph();
  if (!graph) return [];

  const tracks = await njTrackCoordsByRoute();
  return orderedStopsOnNjRoute(graph, route, tracks.get(route) ?? null);
}
