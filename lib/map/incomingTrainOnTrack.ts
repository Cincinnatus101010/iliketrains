import type { TrackEngine } from "./trackEngine";

const MAX_APPROACH_M = 28_000;

/** Schedule progress: 0 upstream, 1 at the boarding point on the line. */
export function lngLatForIncomingOnTrack(
  engine: TrackEngine,
  routeId: string,
  boardingLonLat: [number, number],
  approachProgress: number,
  approachFromHighDist = false,
): { lon: number; lat: number } | null {
  const route = routeId.trim().toUpperCase();
  if (!route || !engine.ready) return null;

  const hit = engine.project(route, boardingLonLat[1], boardingLonLat[0]);
  if (!hit) return null;

  const track = engine.getRoute(route);
  if (!track) return null;

  const boardingDist = hit.trackDist;
  const progress = Math.max(0, Math.min(1, approachProgress));
  const trailingM = Math.min(
    approachFromHighDist ? track.totalDist - boardingDist : boardingDist,
    MAX_APPROACH_M,
  );
  const offset = (1 - progress) * trailingM;

  const distAlong = approachFromHighDist
    ? Math.min(track.totalDist, boardingDist + offset)
    : Math.max(0, boardingDist - offset);

  return engine.pointAtDist(route, distAlong);
}
