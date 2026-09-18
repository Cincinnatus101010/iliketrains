import fs from "node:fs";
import path from "node:path";

function normalize(name: string): string {
  return name.trim().toUpperCase().replace(/\s+STATION$/i, "");
}

type StopPoint = { lat: number; lon: number; name: string };

function load(): Map<string, StopPoint> {
  const map = new Map<string, StopPoint>();
  const root = process.cwd();

  for (const csvPath of [
    path.join(root, "public", "data", "njt-stops.txt"),
    path.join(root, "lib", "nj", "data", "njt-stops.txt"),
  ]) {
    if (!fs.existsSync(csvPath)) continue;
    for (const line of fs.readFileSync(csvPath, "utf8").split("\n").slice(1)) {
      if (!line.trim()) continue;
      const parts = line.split(",");
      if (parts.length < 4) continue;
      const name = parts[1]?.trim();
      const lat = Number.parseFloat(parts[2] ?? "");
      const lon = Number.parseFloat(parts[3] ?? "");
      if (name && Number.isFinite(lat) && Number.isFinite(lon)) {
        map.set(normalize(name), { lat, lon, name });
      }
    }
  }

  const geoPath = path.join(root, "public", "data", "nj-rail-stops.geojson");
  if (fs.existsSync(geoPath)) {
    const geo = JSON.parse(fs.readFileSync(geoPath, "utf8")) as {
      features: Array<{
        properties: { name?: string };
        geometry: { coordinates: [number, number] };
      }>;
    };
    for (const feat of geo.features) {
      const name = feat.properties.name?.trim();
      if (!name) continue;
      const [lon, lat] = feat.geometry.coordinates;
      if (!map.has(normalize(name))) {
        map.set(normalize(name), { lat, lon, name });
      }
    }
  }

  return map;
}

const byKey = load();
const stopList = [...byKey.values()];

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function tryGetCoordinates(
  stopName: string | null | undefined,
): { lat: number; lon: number } | null {
  if (!stopName?.trim()) return null;
  const key = normalize(stopName);
  const exact = byKey.get(key);
  if (exact) return { lat: exact.lat, lon: exact.lon };

  for (const [nameKey, stop] of byKey) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return { lat: stop.lat, lon: stop.lon };
    }
  }
  return null;
}

/** Nearest NJ station within maxM meters (for trains stopped at a platform). */
export function distanceToStopM(lat: number, lon: number, stopName: string): number | null {
  const coords = tryGetCoordinates(stopName);
  if (!coords) return null;
  return haversineM(lat, lon, coords.lat, coords.lon);
}

export function findNearestStop(
  lat: number,
  lon: number,
  maxM = 450,
): { name: string; distanceM: number } | null {
  let best: { name: string; distanceM: number } | null = null;
  for (const stop of stopList) {
    const distanceM = haversineM(lat, lon, stop.lat, stop.lon);
    if (distanceM > maxM) continue;
    if (!best || distanceM < best.distanceM) {
      best = { name: stop.name, distanceM };
    }
  }
  return best;
}
