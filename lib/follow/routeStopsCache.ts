import type { LiveTrain } from "@/lib/types";
import { getOrderedStopsForTrain } from "./routeStopOrder";

const MAX_CACHE_ENTRIES = 64;

const routeStopsCache = new Map<string, string[]>();
const routeStopsListeners = new Set<() => void>();
const routeStopsInflight = new Map<string, Promise<string[]>>();

export function routeStopsKey(train: LiveTrain): string {
  return `${train.network}:${train.route}:${train.anchorStopId ?? train.stopId ?? ""}`;
}

function touchCache(key: string, names: string[]): void {
  if (routeStopsCache.has(key)) routeStopsCache.delete(key);
  routeStopsCache.set(key, names);
  while (routeStopsCache.size > MAX_CACHE_ENTRIES) {
    const oldest = routeStopsCache.keys().next().value;
    if (oldest === undefined) break;
    routeStopsCache.delete(oldest);
  }
}

function emitRouteStopsChange(): void {
  for (const listener of routeStopsListeners) {
    listener();
  }
}

export function ensureRouteStopsLoaded(train: LiveTrain): void {
  const key = routeStopsKey(train);
  if (routeStopsCache.has(key) || routeStopsInflight.has(key)) return;

  const pending = getOrderedStopsForTrain(train).then((names) => {
    touchCache(key, names);
    routeStopsInflight.delete(key);
    emitRouteStopsChange();
    return names;
  });
  routeStopsInflight.set(key, pending);
}

export function subscribeRouteStops(onChange: () => void): () => void {
  routeStopsListeners.add(onChange);
  return () => {
    routeStopsListeners.delete(onChange);
  };
}

export function getRouteStopsSnapshot(train: LiveTrain | null): string[] {
  if (!train) return [];
  const key = routeStopsKey(train);
  const cached = routeStopsCache.get(key);
  if (cached) {
    touchCache(key, cached);
    return cached;
  }
  return [];
}

/** Clears cached route stop lists (for tests or graph reloads). */
export function clearRouteStopsCache(): void {
  routeStopsCache.clear();
  routeStopsInflight.clear();
  emitRouteStopsChange();
}
