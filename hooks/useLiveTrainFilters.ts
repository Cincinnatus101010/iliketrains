"use client";

import { useMemo } from "react";
import { type LineKey, lineKey } from "@/lib/lineKey";
import { trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { filterMapVisibleTrains, filterScopedTrains } from "@/lib/mapVisibleTrains";
import { isEnRouteToBoarding } from "@/lib/trip/boardingArrival";
import { boardingNodeIndex } from "@/lib/trip/incomingTrainEstimate";
import { resolveTrackedTrain } from "@/lib/trip/resolveTrackedTrain";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { tripBoardingContext } from "@/lib/trip/tripBoarding";
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

  const boardingStationName = useMemo(() => {
    if (!savedTrip) return null;
    return tripBoardingContext(savedTrip.route, savedTrip.fromName)?.stationName ?? null;
  }, [savedTrip]);

  const chosenLiveEnRoute = useMemo(() => {
    if (!savedTrip?.chosenDeparture || !trackedTrain || !boardingStationName) return false;
    const live = resolveTrackedTrain(allTrains, trackingTrainId, savedTrip);
    if (!live || live.id !== trackedTrain.id) return false;
    return isEnRouteToBoarding(live, boardingStationName);
  }, [savedTrip, allTrains, trackedTrain, boardingStationName, trackingTrainId]);

  const tripApproachFocus = waitingForTrackedTrain || chosenLiveEnRoute;

  const visibleTrains = useMemo(() => {
    if (waitingForTrackedTrain) return [];
    if (chosenLiveEnRoute && trackedTrain) return [trackedTrain];
    let list = filterMapVisibleTrains(allTrains, scope, activeLine);
    if (trackingTrainId && trackedTrain && !list.some((t) => t.id === trackedTrain.id)) {
      list = [...list, trackedTrain];
    }
    return list;
  }, [
    allTrains,
    scope,
    activeLine,
    waitingForTrackedTrain,
    chosenLiveEnRoute,
    trackingTrainId,
    trackedTrain,
  ]);

  const tripTrackFocus = useMemo((): TripTrackFocus | null => {
    if (!tripApproachFocus || !savedTrip) return null;
    return tripTrackFocusForWaitingTrain(savedTrip);
  }, [tripApproachFocus, savedTrip]);

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
    if (!tripApproachFocus || coords.length < 2) return coords;
    const end = boardingNodeIndex(savedTrip.route);
    return coords.slice(0, Math.min(end, coords.length - 1) + 1);
  }, [savedTrip, tripApproachFocus]);

  const plannedRouteFitKey =
    savedTrip && !tripApproachFocus
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
    chosenLiveEnRoute,
    boardingStationName,
    lineCounts,
  };
}
