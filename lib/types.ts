export type NjTrain = {
  id: string;
  route: string;
  label: string;
  latitude: number;
  longitude: number;
  color: string;
  stopName: string | null;
  trainNumber: string | null;
  status: string;
  inMotion: boolean;
};

export type TrainsResponse = {
  trains: NjTrain[];
  error: string | null;
  configured: boolean;
  updatedAt?: string;
};
