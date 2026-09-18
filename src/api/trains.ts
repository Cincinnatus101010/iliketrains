import type { Key } from "steddy";
import type { TrainsResponse } from "../types";

export async function fetchNjTrains(_key: Key, { signal }: { signal: AbortSignal }): Promise<TrainsResponse> {
  const res = await fetch("/api/trains", { signal });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<TrainsResponse>;
}
