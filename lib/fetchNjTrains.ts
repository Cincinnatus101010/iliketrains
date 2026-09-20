import type { Key } from "steddy";
import { fetchJson } from "@/lib/fetchJson";
import type { TrainsResponse } from "./types";

export async function fetchNjTrains(
  _key: Key,
  { signal }: { signal: AbortSignal },
): Promise<TrainsResponse> {
  return fetchJson<TrainsResponse>("/api/trains", signal);
}
