import type { Key } from "steddy";
import { EMPTY_TRAINS_RESPONSE, trainIdFromFollowedTrainKey } from "@/lib/liveFeedConfig";
import type { TrainsResponse } from "./types";

export async function fetchFollowedTrain(
  key: Key,
  { signal }: { signal: AbortSignal },
): Promise<TrainsResponse> {
  const id = trainIdFromFollowedTrainKey(key).trim();
  if (!id) {
    return EMPTY_TRAINS_RESPONSE;
  }
  const res = await fetch(`/api/train?id=${encodeURIComponent(id)}`, {
    signal,
    cache: "no-store",
  });
  const data = (await res.json()) as TrainsResponse;
  if (!res.ok && !data.error) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
