import fs from "node:fs";
import path from "node:path";
import { pointBeforeStopOnLine } from "@/lib/follow/trackProject";
import { tryGetCoordinates } from "./stopIndex";

let routeCoords: Map<string, [number, number][]> | null = null;

function loadRouteCoords(): Map<string, [number, number][]> {
  if (routeCoords) return routeCoords;
  routeCoords = new Map();
  const filePath = path.join(process.cwd(), "public", "data", "nj-rail-tracks.geojson");
  if (!fs.existsSync(filePath)) return routeCoords;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    features?: Array<{
      properties?: { route?: string };
      geometry?: { coordinates?: [number, number][] };
    }>;
  };

  for (const feat of data.features ?? []) {
    const route = feat.properties?.route?.trim().toUpperCase();
    const coords = feat.geometry?.coordinates;
    if (route && coords && coords.length >= 2) {
      routeCoords.set(route, coords);
    }
  }
  return routeCoords;
}

function validGps(lat: number | null, lon: number | null): lat is number {
  return (
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    (Math.abs(lat) >= 0.01 || Math.abs(lon) >= 0.01)
  );
}

/** Resolve map position for an NJ vehicle (GPS preferred; else along-track before next stop). */
export function njResolveVehiclePosition(
  route: string,
  nextStop: string | null,
  lat: number | null,
  lon: number | null,
): { lat: number; lon: number } | null {
  if (validGps(lat, lon)) {
    return { lat, lon: lon! };
  }

  if (!nextStop?.trim()) return null;
  const stop = tryGetCoordinates(nextStop);
  if (!stop) return null;

  const line = loadRouteCoords().get(route.toUpperCase());
  if (line) {
    const along = pointBeforeStopOnLine(line, stop.lat, stop.lon, 2_000);
    if (along) return along;
  }

  return { lat: stop.lat, lon: stop.lon };
}
