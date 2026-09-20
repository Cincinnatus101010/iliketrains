import type { Key } from "steddy";
import { fetchJson } from "@/lib/fetchJson";
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
  return fetchJson<TrainsResponse>(`/api/train?id=${encodeURIComponent(id)}`, signal);
}
