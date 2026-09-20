import type { Key } from "steddy";
import type { TrainsResponse } from "@/lib/types";

export const NJ_TRAINS_KEY = ["nj-trains"] as const;
export const SUBWAY_TRAINS_KEY = ["subway-trains"] as const;

export const NJ_TRAINS_POLL_MS = 20_000;
export const SUBWAY_TRAINS_POLL_MS = 5_000;
export const FOLLOWED_TRAIN_POLL_MS = 5_000;

const FOLLOWED_TRAIN_NAMESPACE = "followed-train";

export function followedTrainKey(trainId: string) {
  return [FOLLOWED_TRAIN_NAMESPACE, trainId] as const;
}

/** Read the train id segment from a steddy tuple key like `["followed-train", id]`. */
export function trainIdFromFollowedTrainKey(key: Key): string {
  if (typeof key === "string") return key;
  if (Array.isArray(key) && key[0] === FOLLOWED_TRAIN_NAMESPACE) {
    return String(key[1] ?? "");
  }
  return String(key[1] ?? "");
}

export const EMPTY_TRAINS_RESPONSE: TrainsResponse = {
  trains: [],
  error: null,
  configured: true,
};
