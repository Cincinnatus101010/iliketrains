import type { Key } from "steddy";
import type { ScheduleResponse } from "./types";

export async function fetchStationScheduleClient(
  key: Key,
  { signal }: { signal: AbortSignal },
): Promise<ScheduleResponse> {
  const station = typeof key === "string" ? key : String(key[1] ?? "");
  const line = typeof key !== "string" && key[2] != null ? String(key[2]) : "";
  const params = new URLSearchParams({ station });
  if (line) params.set("line", line);
  const res = await fetch(`/api/schedule?${params}`, { signal, cache: "no-store" });
  return res.json() as Promise<ScheduleResponse>;
}
