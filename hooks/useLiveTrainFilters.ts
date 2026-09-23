"use client";

import { useMemo } from "react";
import { type LineKey, lineKey } from "@/lib/lineKey";
import { trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { filterMapVisibleTrains, filterScopedTrains } from "@/lib/mapVisibleTrains";
import { boardingNodeIndex } from "@/lib/trip/incomingTrainEstimate";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import { type TripTrackFocus, tripTrackFocusForWaitingTrain } from "@/lib/trip/tripTrackFocus";
import type { LiveTrain, MapScope } from "@/types";

type UseLiveTrainFiltersOptions = {
  allTrains: LiveTrain[];
  scope: MapScope;
  activeLine: LineKey | null;
  savedTrip: SavedTrip | null;
  trackingTrainId: string | null;
  trackedTrain: LiveTrain | null;
  waitingForTrackedTrain: boolean;
};

export function useLiveTrainFilters({
  allTrains,
  scope,
  activeLine,
  savedTrip,
  trackingTrainId,
  trackedTrain,
  waitingForTrackedTrain,
}: UseLiveTrainFiltersOptions) {
  const scopedTrains = useMemo(() => filterScopedTrains(allTrains, scope), [allTrains, scope]);

  const visibleTrains = useMemo(() => {
    if (waitingForTrackedTrain) return [];
    let list = filterMapVisibleTrains(allTrains, scope, activeLine);
    if (trackingTrainId && trackedTrain && !list.some((t) => t.id === trackingTrainId)) {
      list = [...list, trackedTrain];
    }
    return list;
  }, [allTrains, scope, activeLine, waitingForTrackedTrain, trackingTrainId, trackedTrain]);

  const tripTrackFocus = useMemo((): TripTrackFocus | null => {
    if (!waitingForTrackedTrain || !savedTrip) return null;
    return tripTrackFocusForWaitingTrain(savedTrip);
  }, [waitingForTrackedTrain, savedTrip]);

  const mapLiveCount = savedTrip
    ? scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).length
    : scopedTrains.length;

  const mapTrainsSignature = useMemo(() => trainPositionsSignature(visibleTrains), [visibleTrains]);

  const tripHighlightTrainIds = useMemo(() => {
    if (!savedTrip) return new Set<string>();
    if (trackingTrainId) return new Set([trackedTrain?.id ?? trackingTrainId]);
    const ids = scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).map((t) => t.id);
    return new Set(ids);
  }, [scopedTrains, savedTrip, trackingTrainId, trackedTrain]);

  const tripHighlightKey = useMemo(
    () => [...tripHighlightTrainIds].sort().join("\n"),
    [tripHighlightTrainIds],
  );

  const plannedRouteCoords = useMemo((): [number, number][] | null => {
    if (!savedTrip) return null;
    const coords = savedTrip.route.coordinatesLonLat;
    if (!waitingForTrackedTrain || coords.length < 2) return coords;
    const end = boardingNodeIndex(savedTrip.route);
    return coords.slice(0, Math.min(end, coords.length - 1) + 1);
  }, [savedTrip, waitingForTrackedTrain]);

  const plannedRouteFitKey =
    savedTrip && !waitingForTrackedTrain
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
    tripTrackFocus,
    lineCounts,
  };
}
