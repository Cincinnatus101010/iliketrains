import type { Network, ScheduleDeparture } from "./live";

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

/** How a saved trip resolves which live train to track. */
export type TripTrackingState =
  | { mode: "off" }
  | { mode: "auto" }
  | { mode: "train"; trainId: string };

export type SavedTrip = {
  fromKey: string;
  toKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute;
  savedAt: string;
  /** NJ (or first-leg) departure chosen when starting from the schedule list. */
  chosenDeparture?: ScheduleDeparture | null;
  /** How onboard tracking is resolved (auto uses chosen departure when possible). */
  tracking?: TripTrackingState;
};

type TripGraphNode = { name: string; lat: number; lon: number; network: string };
type TripGraphEdge = { from: string; to: string; route: string };

export type TripGraph = {
  nodes: Map<string, TripGraphNode>;
  adjacency: Map<string, TripGraphEdge[]>;
};

export type TripBoardingContext = {
  stationKey: string;
  stationName: string;
  /** Walk time from trip origin until the first train boarding point. */
  walkMinutes: number;
  tripOriginName: string;
};

/** Schedule rows at the first rail boarding stop for a planned trip. */
export type TripBoardingSchedule = {
  stationCode: string | null;
  stationName: string;
  lineCode: string;
  boarding: TripBoardingContext;
  departures: ScheduleDeparture[];
  scheduleError: string | null;
};

export type TripPlanResponse = {
  fromKey: string;
  toKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute | null;
  boarding: TripBoardingSchedule | null;
  error: string | null;
};
