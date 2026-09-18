import fs from "node:fs";
import path from "node:path";

function normalize(name: string): string {
  return name.trim().toUpperCase().replace(/\s+STATION$/i, "");
}

function load(): Map<string, { lat: number; lon: number }> {
  const map = new Map<string, { lat: number; lon: number }>();
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
        map.set(normalize(name), { lat, lon });
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
        map.set(normalize(name), { lat, lon });
      }
    }
  }

  return map;
}

const byKey = load();

export function tryGetCoordinates(
  stopName: string | null | undefined,
): { lat: number; lon: number } | null {
  if (!stopName?.trim()) return null;
  const key = normalize(stopName);
  const exact = byKey.get(key);
  if (exact) return exact;

  for (const [nameKey, coords] of byKey) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return coords;
    }
  }
  return null;
}
