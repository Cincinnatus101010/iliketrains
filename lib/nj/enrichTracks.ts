import type { LiveTrain, ScheduleDeparture } from "@/types";
import { normalizePlatformTrack } from "./platformTrack";
import { fetchStationSchedule, matchPlatformTrack } from "./schedule";
import { fetchStationList, resolveStationCode } from "./stations";
import { findNearestStop } from "./stopIndex";

const scheduleCache = new Map<string, { at: number; items: ScheduleDeparture[] }>();
const SCHEDULE_CACHE_MS = 25_000;
const FETCH_CONCURRENCY = 6;

async function getScheduleItems(token: string, stationCode: string): Promise<ScheduleDeparture[]> {
  const cached = scheduleCache.get(stationCode);
  if (cached && Date.now() - cached.at < SCHEDULE_CACHE_MS) {
    return cached.items;
  }
  const res = await fetchStationSchedule(token, stationCode);
  scheduleCache.set(stationCode, { at: Date.now(), items: res.items });
  return res.items;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function stationContextForTrain(
  train: LiveTrain,
  stations: Awaited<ReturnType<typeof fetchStationList>>,
): { code: string; name: string } | null {
  if (train.stopName?.trim()) {
    const code = resolveStationCode(train.stopName, stations);
    if (code) return { code, name: train.stopName.trim() };
  }

  const near = findNearestStop(train.latitude, train.longitude);
  if (!near) return null;

  const code = resolveStationCode(near.name, stations);
  if (!code) return null;
  return { code, name: near.name };
}

export async function enrichLiveTrainsWithTracks(
  trains: LiveTrain[],
  token: string,
): Promise<LiveTrain[]> {
  if (trains.length === 0) return trains;

  const stations = await fetchStationList(token);
  const codesNeeded = new Set<string>();
  const contextById = new Map<string, { code: string; name: string }>();

  for (const train of trains) {
    if (!train.trainNumber) continue;
    const ctx = stationContextForTrain(train, stations);
    if (!ctx) continue;
    contextById.set(train.id, ctx);
    codesNeeded.add(ctx.code);
  }

  const codes = [...codesNeeded];
  const itemsByCode = new Map<string, ScheduleDeparture[]>();

  await mapPool(codes, FETCH_CONCURRENCY, async (code) => {
    const items = await getScheduleItems(token, code);
    itemsByCode.set(code, items);
  });

  return trains.map((train) => {
    if (!train.trainNumber) return train;

    const ctx = contextById.get(train.id);
    if (!ctx) return train;

    const platformTrack = normalizePlatformTrack(
      matchPlatformTrack(train.trainNumber, itemsByCode.get(ctx.code) ?? []),
    );
    if (!platformTrack) {
      if (!train.stopName && ctx.name) {
        return { ...train, stopName: ctx.name };
      }
      return train;
    }

    return {
      ...train,
      stopName: train.stopName ?? ctx.name,
      platformTrack,
    };
  });
}
