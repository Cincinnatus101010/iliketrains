export type Track = {
  points: { lon: number; lat: number }[];
  segDist: number[];
  totalDist: number;
};

export type TrackProjectHit = {
  lat: number;
  lon: number;
  trackDist: number;
};

export class TrackEngine {
  ready = false;
  private routes = new Map<string, Track>();

  async loadFromUrls(urls: string[]): Promise<void> {
    const collections = await Promise.all(urls.map((url) => fetch(url).then((r) => r.json())));
    this.routes.clear();

    for (const collection of collections) {
      for (const feature of collection.features ?? []) {
        const route = feature.properties?.route;
        const coords = feature.geometry?.coordinates as [number, number][] | undefined;
        if (!route || !coords || coords.length < 2) continue;
        this.routes.set(String(route).toUpperCase(), buildTrack(coords));
      }
    }

    this.ready = true;
  }

  getRoute(routeId: string | null | undefined): Track | null {
    if (!routeId) return null;
    return this.routes.get(String(routeId).toUpperCase()) ?? null;
  }

  project(routeId: string, lat: number, lon: number): TrackProjectHit | null {
    const track = this.getRoute(routeId);
    if (!track) return null;
    return nearestOnTrack(track, lon, lat);
  }

  pointAtDist(routeId: string, distAlong: number): { lat: number; lon: number } | null {
    const track = this.getRoute(routeId);
    if (!track) return null;
    return pointAtDist(track, distAlong);
  }
}

function buildTrack(coordsLonLat: [number, number][]): Track {
  const points = coordsLonLat.map(([lon, lat]) => ({ lon, lat }));
  const segDist = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineM(points[i - 1]!, points[i]!);
    segDist.push(total);
  }
  return { points, segDist, totalDist: total };
}

function nearestOnTrack(track: Track, lon: number, lat: number): TrackProjectHit {
  let best = {
    trackDist: 0,
    lat: track.points[0]!.lat,
    lon: track.points[0]!.lon,
    d: Infinity,
  };

  for (let i = 1; i < track.points.length; i++) {
    const a = track.points[i - 1]!;
    const b = track.points[i]!;
    const hit = projectOnSegment(a, b, lon, lat);
    const base = track.segDist[i - 1]!;
    const segLen = track.segDist[i]! - base;
    const distAlong = base + hit.t * segLen;
    if (hit.d < best.d) {
      best = { trackDist: distAlong, lat: hit.lat, lon: hit.lon, d: hit.d };
    }
  }

  return best;
}

function pointAtDist(track: Track, distAlong: number): { lat: number; lon: number } {
  distAlong = clamp(distAlong, 0, track.totalDist);
  let i = 1;
  while (i < track.segDist.length && track.segDist[i]! < distAlong) {
    i++;
  }
  if (i >= track.points.length) {
    const last = track.points[track.points.length - 1]!;
    return { lat: last.lat, lon: last.lon };
  }
  const segStart = track.segDist[i - 1]!;
  const segLen = track.segDist[i]! - segStart;
  const t = segLen <= 0 ? 0 : (distAlong - segStart) / segLen;
  const a = track.points[i - 1]!;
  const b = track.points[i]!;
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  };
}

function projectOnSegment(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
  lon: number,
  lat: number,
) {
  const dx = b.lon - a.lon;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((lon - a.lon) * dx + (lat - a.lat) * dy) / len2;
  t = clamp(t, 0, 1);
  const qx = a.lon + dx * t;
  const qy = a.lat + dy * t;
  const d = haversineM({ lon, lat }, { lon: qx, lat: qy });
  return { t, lat: qy, lon: qx, d };
}

function haversineM(a: { lon: number; lat: number }, b: { lon: number; lat: number }): number {
  const r = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function wrapTrackDist(track: Track, dist: number): number {
  if (track.totalDist <= 0) return dist;
  let d = dist % track.totalDist;
  if (d < 0) d += track.totalDist;
  return d;
}

export function shortestTrackGap(
  track: Track | null,
  fromDist: number | null,
  toDist: number | null,
): { endDist: number | null; gapM: number } {
  if (fromDist == null || toDist == null) {
    return { endDist: toDist, gapM: Infinity };
  }
  if (!track || track.totalDist <= 0) {
    return { endDist: toDist, gapM: Math.abs(toDist - fromDist) };
  }

  const direct = toDist - fromDist;
  const forward = direct >= 0 ? direct : direct + track.totalDist;
  const backward = direct <= 0 ? -direct : track.totalDist - direct;
  const useForward = forward <= backward;
  const gapM = useForward ? forward : backward;
  const endDist = useForward
    ? toDist >= fromDist
      ? toDist
      : toDist + track.totalDist
    : toDist <= fromDist
      ? toDist
      : toDist - track.totalDist;
  return { endDist, gapM };
}

export function markerScaleForZoom(zoom: number): number {
  return clamp(0.5 + (zoom - 9) * 0.11, 0.55, 1.45);
}
