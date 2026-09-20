import type { Key } from "steddy";
import { fetchJson } from "@/lib/fetchJson";
import type { SubwayResponse } from "./types";

export async function fetchSubwayTrains(
  _key: Key,
  { signal }: { signal: AbortSignal },
): Promise<SubwayResponse> {
  return fetchJson<SubwayResponse>("/api/subway", signal);
}
