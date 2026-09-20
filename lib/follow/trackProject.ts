type Track = {
  points: { lon: number; lat: number }[];
  segDist: number[];
  totalDist: number;
};

function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
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

function projectOnTrack(track: Track, lon: number, lat: number): number {
  let bestDist = 0;
  let bestD = Infinity;

  for (let i = 1; i < track.points.length; i++) {
    const a = track.points[i - 1]!;
    const b = track.points[i]!;
    const dx = b.lon - a.lon;
    const dy = b.lat - a.lat;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((lon - a.lon) * dx + (lat - a.lat) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const plon = a.lon + t * dx;
    const plat = a.lat + t * dy;
    const d = haversineM({ lat, lon }, { lat: plat, lon: plon });
    if (d < bestD) {
      bestD = d;
      const base = track.segDist[i - 1]!;
      const segLen = track.segDist[i]! - base;
      bestDist = base + t * segLen;
    }
  }

  return bestDist;
}

function pointAtDist(track: Track, distM: number): { lat: number; lon: number } | null {
  if (track.points.length === 0) return null;
  const d = Math.max(0, Math.min(track.totalDist, distM));
  let i = 1;
  while (i < track.segDist.length && track.segDist[i]! < d) i += 1;
  const i0 = Math.max(0, i - 1);
  const a = track.points[i0]!;
  const b = track.points[Math.min(i0 + 1, track.points.length - 1)]!;
  const base = track.segDist[i0]!;
  const segLen = track.segDist[Math.min(i0 + 1, track.segDist.length - 1)]! - base;
  const t = segLen > 0 ? (d - base) / segLen : 0;
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

/** Place a train slightly before the next stop along the line (when GPS is missing). */
export function pointBeforeStopOnLine(
  coordsLonLat: [number, number][],
  stopLat: number,
  stopLon: number,
  offsetBeforeNextM: number,
): { lat: number; lon: number } | null {
  const track = buildTrack(coordsLonLat);
  const atStop = projectOnTrack(track, stopLon, stopLat);
  return pointAtDist(track, Math.max(0, atStop - offsetBeforeNextM));
}

export function sortStopsAlongCoords(
  stops: { name: string; lat: number; lon: number }[],
  coordsLonLat: [number, number][],
): string[] {
  if (stops.length === 0) return [];
  const track = buildTrack(coordsLonLat);
  const ranked = stops.map((s) => ({
    name: s.name,
    dist: projectOnTrack(track, s.lon, s.lat),
  }));
  ranked.sort((a, b) => a.dist - b.dist || a.name.localeCompare(b.name));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of ranked) {
    const key = row.name.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.name);
  }
  return out;
}
