"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  ensureRouteStopsLoaded,
  getRouteStopsSnapshot,
  subscribeRouteStops,
} from "@/lib/follow/routeStopsCache";
import { type UpcomingStop, upcomingStopsForTrain } from "@/lib/follow/upcomingStops";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import type { LiveTrain } from "@/lib/types";

export function useFollowUpcomingStops(train: LiveTrain | null): UpcomingStop[] {
  const ordered = useSyncExternalStore(
    (onChange) => {
      if (train) ensureRouteStopsLoaded(train);
      return subscribeRouteStops(onChange);
    },
    () => getRouteStopsSnapshot(train),
    () => [],
  );

  const liveKey = train ? trainLiveSignature(train) : "";

  return useMemo(() => {
    if (!train) return [];
    return upcomingStopsForTrain(train, ordered);
  }, [train, ordered, liveKey]);
}
