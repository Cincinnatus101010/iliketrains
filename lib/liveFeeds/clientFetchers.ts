import type { Key } from "steddy";
import { fetchJson } from "@/lib/fetchJson";
import type { LiveFeedResponse } from "@/types";
import { EMPTY_LIVE_FEED, trainIdFromFollowedTrainKey } from "./config";

type FetcherContext = { signal: AbortSignal };

async function fetchLiveFeed(path: string, signal: AbortSignal): Promise<LiveFeedResponse> {
  return fetchJson<LiveFeedResponse>(path, signal);
}

export async function fetchNjLiveFeed(_key: Key, { signal }: FetcherContext) {
  return fetchLiveFeed("/api/trains", signal);
}

export async function fetchMtaLiveFeed(_key: Key, { signal }: FetcherContext) {
  return fetchLiveFeed("/api/subway", signal);
}

export async function fetchFollowedLiveFeed(key: Key, { signal }: FetcherContext) {
  const id = trainIdFromFollowedTrainKey(key).trim();
  if (!id) return EMPTY_LIVE_FEED;
  return fetchLiveFeed(`/api/train?id=${encodeURIComponent(id)}`, signal);
}
