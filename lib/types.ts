export type NjTrain = {
  id: string;
  route: string;
  lineName: string;
  label: string;
  latitude: number;
  longitude: number;
  color: string;
  stopName: string | null;
  trainNumber: string | null;
  direction: string | null;
  trackCircuit: string | null;
  platformTrack: string | null;
  scheduledDeparture: string | null;
  status: string;
  inMotion: boolean;
};

export type TrainsResponse = {
  trains: NjTrain[];
  error: string | null;
  configured: boolean;
  updatedAt?: string;
};

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
