import type { TrainsResponse } from "@/lib/types";

export const NJ_TRAINS_KEY = ["nj-trains"] as const;
export const SUBWAY_TRAINS_KEY = ["subway-trains"] as const;

export const NJ_TRAINS_POLL_MS = 20_000;
export const SUBWAY_TRAINS_POLL_MS = 5_000;
export const FOLLOWED_TRAIN_POLL_MS = 5_000;

export function followedTrainKey(trainId: string) {
  return ["followed-train", trainId] as const;
}

export const EMPTY_TRAINS_RESPONSE: TrainsResponse = {
  trains: [],
  error: null,
  configured: true,
};
