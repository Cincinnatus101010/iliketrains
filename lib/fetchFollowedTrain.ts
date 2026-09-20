import type { Key } from "steddy";
import type { TrainsResponse } from "./types";

export async function fetchFollowedTrain(
  key: Key,
  { signal }: { signal: AbortSignal },
): Promise<TrainsResponse> {
  const id = typeof key === "string" ? key : String(key[1] ?? "");
  if (!id) {
    return { trains: [], error: null, configured: true };
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
