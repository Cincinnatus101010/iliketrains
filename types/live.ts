export type Network = "mta" | "njt";

export type LiveTrain = {
  id: string;
  network: Network;
  route: string;
  lineName: string;
  label: string;
  latitude: number;
  longitude: number;
  color: string;
  stopName: string | null;
  /** MTA GTFS stop_id (platform suffix) */
  stopId?: string | null;
  /** MTA parent station id for stable anchoring */
  anchorStopId?: string | null;
  trainNumber: string | null;
  direction: string | null;
  trackCircuit: string | null;
  platformTrack: string | null;
  scheduledDeparture: string | null;
  status: string;
  inMotion: boolean;
  /** NJ/MTA: train is stopped at a platform (not just passing). */
  atStation?: boolean;
};

/** JSON shape for `/api/trains`, `/api/subway`, and `/api/train`. */
export type LiveFeedResponse = {
  trains: LiveTrain[];
  error: string | null;
  configured: boolean;
  updatedAt?: string;
};

export type TrainsResponse = LiveFeedResponse;
export type SubwayResponse = LiveFeedResponse;

export type MapScope = "all" | "mta" | "njt";

export type NjStation = {
  code: string;
  name: string;
  shortName: string;
};

export type ScheduleDeparture = {
  trainId: string;
  destination: string;
  line: string;
  lineCode: string;
  lineAbbrev: string;
  track: string | null;
  scheduledAt: string;
  status: string;
  secLate: number;
};

export type ScheduleResponse = {
  stationCode: string;
  stationName: string;
  items: ScheduleDeparture[];
  error: string | null;
};
