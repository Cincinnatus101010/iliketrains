"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  ensureRouteStopsLoaded,
  getRouteStopsSnapshot,
  subscribeRouteStops,
} from "@/lib/follow/routeStopsCache";
import { type UpcomingStop, upcomingStopsForTrain } from "@/lib/follow/upcomingStops";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import type { LiveTrain } from "@/types";

type UseFollowUpcomingStopsOptions = {
  throughStopName?: string | null;
};

export function useFollowUpcomingStops(
  train: LiveTrain | null,
  opts?: UseFollowUpcomingStopsOptions,
): UpcomingStop[] {
  useEffect(() => {
    if (train) ensureRouteStopsLoaded(train);
  }, [train]);

  const ordered = useSyncExternalStore(
    subscribeRouteStops,
    () => getRouteStopsSnapshot(train),
    () => getRouteStopsSnapshot(null),
  );

  const liveKey = train ? trainLiveSignature(train) : "";

  const throughStopName = opts?.throughStopName ?? null;

  return useMemo(() => {
    if (!train) return [];
    return upcomingStopsForTrain(train, ordered, { throughStopName });
  }, [train, ordered, liveKey, throughStopName]);
}
