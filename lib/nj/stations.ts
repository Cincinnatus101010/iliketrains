import type { NjStation } from "@/types";
import { config } from "./config";

type RawStation = {
  STATION_2CHAR?: string;
  STATIONNAME?: string;
  STATION_14CHAR?: string;
};

let cached: { at: number; stations: NjStation[] } | null = null;
const CACHE_MS = 24 * 60 * 60 * 1000;

function normalize(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, " ");
}

export async function fetchStationList(token: string): Promise<NjStation[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.stations;
  }

  const form = new FormData();
  form.append("token", token);
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getStationList`;
  const response = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  if (!response.ok) {
    return cached?.stations ?? [];
  }

  const rows = (await response.json()) as RawStation[];
  if (!Array.isArray(rows)) {
    return cached?.stations ?? [];
  }

  const stations = rows
    .map((r) => ({
      code: r.STATION_2CHAR?.trim() ?? "",
      name: r.STATIONNAME?.trim() ?? "",
      shortName: r.STATION_14CHAR?.trim() ?? r.STATIONNAME?.trim() ?? "",
    }))
    .filter((s) => s.code && s.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  cached = { at: Date.now(), stations };
  return stations;
}

export function resolveStationCode(
  stopName: string | null | undefined,
  stations: NjStation[],
): string | null {
  if (!stopName?.trim()) return null;
  const key = normalize(stopName);

  for (const s of stations) {
    const candidates = [s.name, s.shortName].map(normalize);
    if (candidates.some((c) => c === key || c.includes(key) || key.includes(c))) {
      return s.code;
    }
  }
  return null;
}
