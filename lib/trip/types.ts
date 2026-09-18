export type RouteStep = {
  kind: "ride" | "walk" | "stay";
  route: string | null;
  fromName: string;
  toName: string;
  color: string | null;
};

export type PlannedRoute = {
  steps: RouteStep[];
  coordinatesLonLat: [number, number][];
  stopCount: number;
};

export type PlanStation = {
  key: string;
  name: string;
  network: "mta" | "njt";
  lat: number;
  lon: number;
};
