import { type LineKey, trainMatchesLineKey } from "@/lib/lineKey";
import type { LiveTrain, MapScope } from "@/types";

export function filterScopedTrains(trains: LiveTrain[], scope: MapScope): LiveTrain[] {
  if (scope === "mta") return trains.filter((t) => t.network === "mta");
  if (scope === "njt") return trains.filter((t) => t.network === "njt");
  return trains;
}

/** Map markers: all live trains in the current scope/line. Never collapse to one train. */
export function filterMapVisibleTrains(
  trains: LiveTrain[],
  scope: MapScope,
  activeLine: LineKey | null,
): LiveTrain[] {
  return filterScopedTrains(trains, scope).filter((t) => trainMatchesLineKey(t, activeLine));
}
