import { colorForRoute, routeFromApiLine } from "./njRoutes";
import { tryGetCoordinates } from "./stopIndex";
import type { NjTrain } from "@/lib/types";

function getString(row: Record<string, unknown>, key: string): string | null {
  const v = row[key];
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function parseLateMinutes(secLate: string | null): number {
  if (!secLate) return 0;
  const sec = Number.parseInt(secLate, 10);
  if (!Number.isFinite(sec)) return 0;
  return Math.max(0, Math.floor(sec / 60));
}

function statusLabel(lateMin: number): string {
  if (lateMin <= 0) return "Between stations";
  if (lateMin === 1) return "1 min late";
  return `${lateMin} min late`;
}

function tryParseCoord(row: Record<string, unknown>, key: string): number | null {
  const v = row[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function resolveLocation(
  row: Record<string, unknown>,
  nextStop: string | null,
): { lat: number; lon: number } | null {
  const lat = tryParseCoord(row, "LATITUDE");
  const lon = tryParseCoord(row, "LONGITUDE");
  if (lat != null && lon != null && (Math.abs(lat) >= 0.01 || Math.abs(lon) >= 0.01)) {
    return { lat, lon };
  }
  return tryGetCoordinates(nextStop);
}

export function parseVehicle(row: Record<string, unknown>): NjTrain | null {
  const trainLine = getString(row, "TRAIN_LINE");
  const route = routeFromApiLine(trainLine);
  if (!route) return null;

  const trainNumber = getString(row, "ID")?.trim() ?? null;
  const nextStop = getString(row, "NEXT_STOP")?.trim() ?? null;

  const loc = resolveLocation(row, nextStop);
  if (!loc) return null;

  const lateMin = parseLateMinutes(getString(row, "SEC_LATE"));
  const status = statusLabel(lateMin);
  const inMotion = Boolean(nextStop) || lateMin > 0;
  const label = nextStop ?? status;

  return {
    id: `njt-${trainNumber ?? crypto.randomUUID().slice(0, 8)}`,
    route,
    label,
    latitude: loc.lat,
    longitude: loc.lon,
    color: colorForRoute(route),
    stopName: nextStop,
    trainNumber,
    status,
    inMotion,
  };
}
