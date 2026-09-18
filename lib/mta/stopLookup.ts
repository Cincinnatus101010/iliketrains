import fs from "node:fs";
import path from "node:path";

type StopRecord = { lat: number; lon: number; name: string };

let cached: {
  stops: Map<string, StopRecord>;
  anchorByStop: Map<string, string>;
} | null = null;

function loadStops(): NonNullable<typeof cached> {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "lib/mta/data/mta-stops.txt");
  const stops = new Map<string, StopRecord>();
  const anchorByStop = new Map<string, string>();

  if (!fs.existsSync(filePath)) {
    cached = { stops, anchorByStop };
    return cached;
  }

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).slice(1);

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    if (parts.length < 4) continue;

    const id = parts[0]?.trim() ?? "";
    if (!id || stops.has(id)) continue;

    const lat = Number.parseFloat(parts[2] ?? "");
    const lon = Number.parseFloat(parts[3] ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const name = (parts[1] ?? "").trim();
    stops.set(id, { lat, lon, name });

    const parent = (parts[5] ?? "").trim();
    anchorByStop.set(id, parent.length > 0 ? parent : id);
  }

  cached = { stops, anchorByStop };
  return cached;
}

export function getAnchorStopId(stopId: string | null | undefined): string | null {
  if (!stopId?.trim()) return null;
  const id = stopId.trim();
  const { anchorByStop } = loadStops();
  return anchorByStop.get(id) ?? id;
}

export function getStopName(stopId: string | null | undefined): string | null {
  if (!stopId?.trim()) return null;
  const rec = loadStops().stops.get(stopId.trim());
  return rec?.name ?? null;
}

export function tryGetStopCoordinates(
  stopId: string | null | undefined,
): { lat: number; lon: number } | null {
  if (!stopId?.trim()) return null;
  const rec = loadStops().stops.get(stopId.trim());
  if (!rec) return null;
  return { lat: rec.lat, lon: rec.lon };
}
