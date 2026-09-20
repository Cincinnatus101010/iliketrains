"use client";

import { useMemo } from "react";
import { type LineKey, lineKey, trainMatchesLineKey } from "@/lib/lineKey";
import { trainPositionsSignature } from "@/lib/map/trainSyncKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import type { LiveTrain, MapScope } from "@/lib/types";

type UseLiveTrainFiltersOptions = {
  allTrains: LiveTrain[];
  scope: MapScope;
  activeLine: LineKey | null;
  savedTrip: SavedTrip | null;
  isTracking: boolean;
  trackingTrainId: string | null;
};

export function useLiveTrainFilters({
  allTrains,
  scope,
  activeLine,
  savedTrip,
  isTracking,
  trackingTrainId,
}: UseLiveTrainFiltersOptions) {
  const scopedTrains = useMemo(() => {
    if (scope === "mta") return allTrains.filter((t) => t.network === "mta");
    if (scope === "njt") return allTrains.filter((t) => t.network === "njt");
    return allTrains;
  }, [allTrains, scope]);

  const visibleTrains = useMemo(() => {
    if (isTracking) {
      return allTrains.filter((t) => trainMatchesLineKey(t, activeLine));
    }
    let filtered = scopedTrains.filter((t) => trainMatchesLineKey(t, activeLine));
    if (savedTrip) {
      filtered = filtered.filter((t) => trainMatchesTrip(t, savedTrip));
    }
    return filtered;
  }, [isTracking, allTrains, scopedTrains, activeLine, savedTrip]);

  const mapLiveCount = isTracking
    ? visibleTrains.length
    : savedTrip
      ? visibleTrains.length
      : scopedTrains.length;

  const mapTrainsSignature = useMemo(() => trainPositionsSignature(visibleTrains), [visibleTrains]);

  const tripHighlightTrainIds = useMemo(() => {
    if (!savedTrip) return new Set<string>();
    if (trackingTrainId) return new Set([trackingTrainId]);
    const ids = scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).map((t) => t.id);
    return new Set(ids);
  }, [scopedTrains, savedTrip, trackingTrainId]);

  const tripHighlightKey = useMemo(
    () => [...tripHighlightTrainIds].sort().join("\n"),
    [tripHighlightTrainIds],
  );

  const showPlannedRoute = Boolean(savedTrip) && !trackingTrainId;
  const plannedRouteCoords = showPlannedRoute ? (savedTrip?.route.coordinatesLonLat ?? null) : null;
  const plannedRouteFitKey =
    showPlannedRoute && savedTrip
      ? `${savedTrip.fromKey}:${savedTrip.toKey}:${savedTrip.savedAt}`
      : null;

  const lineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of scopedTrains) {
      const key = lineKey(t.network, t.route);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [scopedTrains]);

  return {
    scopedTrains,
    visibleTrains,
    mapLiveCount,
    mapTrainsSignature,
    tripHighlightTrainIds,
    tripHighlightKey,
    plannedRouteCoords,
    plannedRouteFitKey,
    lineCounts,
  };
}
