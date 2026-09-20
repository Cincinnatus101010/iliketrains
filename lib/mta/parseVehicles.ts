import type { LiveTrain } from "@/lib/types";
import { subwayLineName } from "./lines";
import { getAnchorStopId, getStopName, tryGetStopCoordinates } from "./stopLookup";
import { colorForSubwayRoute } from "./subwayRoutes";

type FeedEntity = import("gtfs-realtime-bindings").transit_realtime.IFeedEntity;
type VehiclePosition = import("gtfs-realtime-bindings").transit_realtime.IVehiclePosition;

type VehicleStopStatusValue = number;

function routeId(raw: string | null | undefined): string {
  if (!raw?.trim()) return "?";
  return raw.trim().toUpperCase();
}

function statusLabel(status: VehicleStopStatusValue | null | undefined): string {
  switch (status) {
    case 0:
      return "Approaching";
    case 1:
      return "At platform";
    case 2:
      return "Between stations";
    default:
      return "En route";
  }
}

function readGps(pos: VehiclePosition["position"]): { lat: number; lon: number } | null {
  if (!pos) return null;
  const lat = pos.latitude ?? 0;
  const lon = pos.longitude ?? 0;
  if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function resolveLocation(
  vehicle: VehiclePosition,
  rawStopId: string | null,
  anchorStopId: string | null,
  currentStatus: VehicleStopStatusValue | null | undefined,
): { lat: number; lon: number } | null {
  const gps = readGps(vehicle.position);
  const atPlatform = currentStatus === 1;

  if (!atPlatform && gps) {
    return gps;
  }

  const fromRaw = tryGetStopCoordinates(rawStopId);
  if (fromRaw) return fromRaw;

  const fromAnchor = tryGetStopCoordinates(anchorStopId);
  if (fromAnchor) return fromAnchor;

  return gps;
}

export function parseSubwayEntity(entity: FeedEntity): LiveTrain | null {
  const vehicle = entity.vehicle;
  if (!vehicle) return null;

  let route = routeId(vehicle.trip?.routeId);
  if (route === "?") {
    route = routeId(entity.tripUpdate?.trip?.routeId);
  }
  if (route === "?") return null;

  const rawStopId = vehicle.stopId?.trim() || null;
  const anchorStopId = getAnchorStopId(rawStopId);
  const loc = resolveLocation(vehicle, rawStopId, anchorStopId, vehicle.currentStatus ?? undefined);
  if (!loc) return null;

  const trainId = vehicle.vehicle?.id ?? entity.id ?? crypto.randomUUID();
  const stopName = getStopName(rawStopId) ?? getStopName(anchorStopId);
  const status = statusLabel(vehicle.currentStatus ?? undefined);
  const atStation = vehicle.currentStatus === 1;
  const inMotion = vehicle.currentStatus === 0 || vehicle.currentStatus === 2;
  const label = stopName?.trim() ? stopName : status;

  return {
    id: `mta-${trainId}`,
    network: "mta",
    route,
    lineName: subwayLineName(route),
    label,
    latitude: loc.lat,
    longitude: loc.lon,
    color: colorForSubwayRoute(route),
    stopName,
    stopId: rawStopId,
    anchorStopId,
    trainNumber: null,
    direction: null,
    trackCircuit: null,
    platformTrack: null,
    scheduledDeparture: null,
    status,
    inMotion,
    atStation,
  };
}

export function parseSubwayFeed(entities: FeedEntity[]): LiveTrain[] {
  const byId = new Map<string, LiveTrain>();

  for (const entity of entities) {
    const train = parseSubwayEntity(entity);
    if (train) {
      byId.set(train.id, train);
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.route.localeCompare(b.route, undefined, { sensitivity: "base" }) ||
      a.id.localeCompare(b.id),
  );
}
