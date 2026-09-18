import type { Network } from "@/lib/types";

export type RouteStep = {
  kind: "ride" | "walk" | "stay";
  route: string | null;
  fromName: string;
  toName: string;
  color: string | null;
  network?: Network;
  fromKey?: string;
  toKey?: string;
  walkDistanceM?: number;
  walkMinutes?: number;
};

export type TripStatsLine = {
  network: Network;
  route: string;
  label: string;
};

export type TripStats = {
  rideCount: number;
  walkCount: number;
  transferCount: number;
  stationCount: number;
  totalWalkM: number;
  totalWalkMin: number;
  lines: TripStatsLine[];
};

export type PlannedRoute = {
  steps: RouteStep[];
  coordinatesLonLat: [number, number][];
  stopCount: number;
  stats?: TripStats;
};
