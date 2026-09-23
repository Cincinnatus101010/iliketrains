import { parseLineKey } from "@/lib/lineKey";
import { njtStopNameById } from "@/lib/nj/njtStopCatalog";
import type { NjStation } from "@/types";

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

  const routeSeg = parsed.route.trim();
  const routeUpper = routeSeg.toUpperCase();

  const byCode = stations.find((s) => s.code.toUpperCase() === routeUpper);
  if (byCode) return byCode.code;

  // Trip graph keys use numeric GTFS stop ids (e.g. njt:63 → Hoboken), not 2-char API codes.
  let lookupName = stationName;
  if (/^\d+$/.test(routeSeg)) {
    const catalogName = njtStopNameById(routeSeg);
    if (catalogName) lookupName = catalogName;
  }

  const keyNorm = normalize(lookupName);
  for (const s of stations) {
    const candidates = [s.name, s.shortName].map(normalize);
    if (candidates.some((c) => c === keyNorm || c.includes(keyNorm) || keyNorm.includes(c))) {
      return s.code;
    }
  }

  return null;
}
