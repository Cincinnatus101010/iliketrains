import type { Network } from "@/lib/types";

export type RouteStep = {
  kind: "ride" | "walk" | "stay";
  route: string | null;
  fromName: string;
  toName: string;
  color: string | null;
  network?: Network;
};

export type PlannedRoute = {
  steps: RouteStep[];
  coordinatesLonLat: [number, number][];
  stopCount: number;
};
