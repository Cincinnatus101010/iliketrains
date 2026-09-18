import { parseLineKey } from "@/lib/lineKey";
import type { NjStation } from "@/lib/types";

function normalize(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+STATION$/i, "")
    .replace(/\s+/g, " ");
}

/** Map a trip graph node (e.g. `njt:63`) to a NJ Rail API station code (e.g. `HB`). */
export function resolveNjStationCodeForTrip(
  stationKey: string,
  stationName: string,
  stations: NjStation[],
): string | null {
  const parsed = parseLineKey(stationKey);
  if (parsed?.network !== "njt") return null;

  const byCode = stations.find((s) => s.code.toUpperCase() === parsed.route.toUpperCase());
  if (byCode) return byCode.code;

  const keyNorm = normalize(stationName);
  for (const s of stations) {
    const candidates = [s.name, s.shortName].map(normalize);
    if (candidates.some((c) => c === keyNorm || c.includes(keyNorm) || keyNorm.includes(c))) {
      return s.code;
    }
  }

  return null;
}
