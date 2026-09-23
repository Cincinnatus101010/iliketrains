import type { TripGraph } from "@/types";
import { parseTripGraphRaw } from "./parseTripGraph";

export type { TripGraph };

let cached: TripGraph | null = null;
let inflight: Promise<TripGraph | null> | null = null;

export async function loadTripGraph(): Promise<TripGraph | null> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/data/transit-graph.json");
      if (!res.ok) return null;
      const raw = (await res.json()) as Parameters<typeof parseTripGraphRaw>[0];
      cached = parseTripGraphRaw(raw);
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

let cachedStationList: { key: string; name: string; network: "mta" | "njt" }[] | null = null;

export async function listPlanStations(): Promise<
  { key: string; name: string; network: "mta" | "njt" }[]
> {
  if (cachedStationList) return cachedStationList;

  const graph = await loadTripGraph();
  if (!graph) return [];

  cachedStationList = [...graph.nodes.entries()]
    .map(([key, n]) => ({
      key,
      name: n.name,
      network: (n.network === "njt" ? "njt" : "mta") as "mta" | "njt",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return cachedStationList;
}
