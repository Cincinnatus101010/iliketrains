import type { TrackEngine } from "./trackEngine";

const MAX_APPROACH_M = 28_000;

/** Schedule progress: 0 upstream, 1 at the boarding point on the line. */
export function lngLatForIncomingOnTrack(
  engine: TrackEngine,
  routeId: string,
  boardingLonLat: [number, number],
  approachProgress: number,
): { lon: number; lat: number } | null {
  const route = routeId.trim().toUpperCase();
  if (!route || !engine.ready) return null;

  const hit = engine.project(route, boardingLonLat[1], boardingLonLat[0]);
  if (!hit) return null;

  const boardingDist = hit.trackDist;
  const progress = Math.max(0, Math.min(1, approachProgress));
  const windowM = Math.min(boardingDist, MAX_APPROACH_M);
  const distAlong = Math.max(0, boardingDist - (1 - progress) * windowM);
  return engine.pointAtDist(route, distAlong);
}
