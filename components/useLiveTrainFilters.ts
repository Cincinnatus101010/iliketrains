"use client";

import { useMemo } from "react";
import { type LineKey, lineKey } from "@/lib/lineKey";
import { trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { filterMapVisibleTrains, filterScopedTrains } from "@/lib/mapVisibleTrains";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import type { LiveTrain, MapScope } from "@/types";

type UseLiveTrainFiltersOptions = {
  allTrains: LiveTrain[];
  scope: MapScope;
  activeLine: LineKey | null;
  savedTrip: SavedTrip | null;
  trackingTrainId: string | null;
};

export function useLiveTrainFilters({
  allTrains,
  scope,
  activeLine,
  savedTrip,
  trackingTrainId,
}: UseLiveTrainFiltersOptions) {
  const scopedTrains = useMemo(() => filterScopedTrains(allTrains, scope), [allTrains, scope]);

  const visibleTrains = useMemo(
    () => filterMapVisibleTrains(allTrains, scope, activeLine),
    [allTrains, scope, activeLine],
  );

  const mapLiveCount = savedTrip
    ? scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).length
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
