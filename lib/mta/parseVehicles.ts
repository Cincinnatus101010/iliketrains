import type { LiveTrain } from "@/lib/types";
import { subwayLineName } from "./lines";
import { colorForSubwayRoute } from "./subwayRoutes";
import { getAnchorStopId, getStopName, tryGetStopCoordinates } from "./stopLookup";

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

function resolveLocation(
  vehicle: VehiclePosition,
  rawStopId: string | null,
  anchorStopId: string | null,
): { lat: number; lon: number } | null {
  const fromRaw = tryGetStopCoordinates(rawStopId);
  if (fromRaw) return fromRaw;

  const fromAnchor = tryGetStopCoordinates(anchorStopId);
  if (fromAnchor) return fromAnchor;

  const pos = vehicle.position;
  if (pos && (Math.abs(pos.latitude ?? 0) >= 0.01 || Math.abs(pos.longitude ?? 0) >= 0.01)) {
    return { lat: pos.latitude ?? 0, lon: pos.longitude ?? 0 };
  }

  return null;
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
  const loc = resolveLocation(vehicle, rawStopId, anchorStopId);
  if (!loc) return null;

  const trainId = vehicle.vehicle?.id ?? entity.id ?? crypto.randomUUID();
  const stopName = getStopName(rawStopId) ?? getStopName(anchorStopId);
  const status = statusLabel(vehicle.currentStatus ?? undefined);
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
    (a, b) => a.route.localeCompare(b.route, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id),
  );
}
