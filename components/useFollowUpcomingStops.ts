"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getOrderedStopsForTrain } from "@/lib/follow/routeStopOrder";
import { type UpcomingStop, upcomingStopsForTrain } from "@/lib/follow/upcomingStops";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import type { LiveTrain } from "@/lib/types";

const routeStopsCache = new Map<string, string[]>();
const routeStopsListeners = new Set<() => void>();
const routeStopsInflight = new Map<string, Promise<string[]>>();

function routeStopsKey(train: LiveTrain): string {
  return `${train.network}:${train.route}:${train.anchorStopId ?? train.stopId ?? ""}`;
}

function emitRouteStopsChange(): void {
  for (const listener of routeStopsListeners) {
    listener();
  }
}

function ensureRouteStopsLoaded(train: LiveTrain): void {
  const key = routeStopsKey(train);
  if (routeStopsCache.has(key) || routeStopsInflight.has(key)) return;

  const pending = getOrderedStopsForTrain(train).then((names) => {
    routeStopsCache.set(key, names);
    routeStopsInflight.delete(key);
    emitRouteStopsChange();
    return names;
  });
  routeStopsInflight.set(key, pending);
}

function subscribeRouteStops(onChange: () => void): () => void {
  routeStopsListeners.add(onChange);
  return () => {
    routeStopsListeners.delete(onChange);
  };
}

function getRouteStopsSnapshot(train: LiveTrain | null): string[] {
  if (!train) return [];
  return routeStopsCache.get(routeStopsKey(train)) ?? [];
}

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
