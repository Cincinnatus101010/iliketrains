import type { Key } from "steddy";
import type { TrainsResponse } from "./types";

export async function fetchNjTrains(
  _key: Key,
  { signal }: { signal: AbortSignal },
): Promise<TrainsResponse> {
  const res = await fetch("/api/trains", { signal, cache: "no-store" });
  const data = (await res.json()) as TrainsResponse;
  if (!res.ok && !data.error) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
