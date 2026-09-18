import type { Key } from "steddy";
import type { SubwayResponse } from "./types";

export async function fetchSubwayTrains(
  _key: Key,
  { signal }: { signal: AbortSignal },
): Promise<SubwayResponse> {
  const res = await fetch("/api/subway", { signal, cache: "no-store" });
  const data = (await res.json()) as SubwayResponse;
  if (!res.ok && !data.error) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
