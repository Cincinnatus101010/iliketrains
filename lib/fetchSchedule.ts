import type { Key } from "steddy";
import type { ScheduleResponse } from "./types";

export async function fetchStationScheduleClient(
  key: Key,
  { signal }: { signal: AbortSignal },
): Promise<ScheduleResponse> {
  const parts = typeof key === "string" ? ([key] as const) : key;
  const tag = String(parts[0] ?? "");
  const station = String(parts[1] ?? parts[0] ?? "");
  if (station === "idle" || station === "skip") {
    return { stationCode: "", stationName: "", items: [], error: null };
  }
  const line =
    (tag === "trip-schedule-station" || tag === "schedule") && parts[2] != null
      ? String(parts[2])
      : "";
  const params = new URLSearchParams({ station });
  if (line) params.set("line", line);
  const res = await fetch(`/api/schedule?${params}`, { signal, cache: "no-store" });
  const text = await res.text();

  try {
    const data = JSON.parse(text) as ScheduleResponse;
    if (!res.ok && !data.error) {
      return {
        ...data,
        items: data.items ?? [],
        error: data.error ?? `HTTP ${res.status}`,
      };
    }
    return data;
  } catch {
    return {
      stationCode: station,
      stationName: "",
      items: [],
      error: text.startsWith("Internal")
        ? "Schedule service error — try again."
        : text.slice(0, 120),
    };
  }
}
