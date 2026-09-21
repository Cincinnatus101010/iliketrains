import type { ScheduleDeparture, ScheduleResponse } from "@/lib/types";
import { config } from "./config";
import { dedupeUpcomingDepartures } from "./dedupeDepartures";
import { canonicalNjRoute, routeFromApiLine } from "./njRoutes";
import { normalizePlatformTrack } from "./platformTrack";
import { fetchStationSchedule } from "./schedule";
import { fetchStationList } from "./stations";

type RawDayItem = {
  SCHED_DEP_DATE?: string;
  DESTINATION?: string;
  TRACK?: string;
  LINE?: string;
  TRAIN_ID?: string;
  DIRECTION?: string;
  STOP_CODE?: string;
};

type RawDayStation = {
  STATION_2CHAR?: string;
  STATIONNAME?: string;
  ITEMS?: RawDayItem[];
};

const dayScheduleCache = new Map<
  string,
  { at: number; items: ScheduleDeparture[]; stationName: string }
>();
const dayFailUntil = new Map<string, number>();
/** API allows ~10 station-schedule calls/day — cache aggressively. */
const DAY_CACHE_MS = 4 * 60 * 60 * 1000;
const DAY_FAIL_COOLDOWN_MS = 15 * 60 * 1000;

function parseDayItem(row: RawDayItem): ScheduleDeparture | null {
  const trainId = row.TRAIN_ID?.trim();
  const scheduledAt = row.SCHED_DEP_DATE?.trim();
  if (!trainId || !scheduledAt) return null;

  const line = row.LINE?.trim() ?? "";
  const route = routeFromApiLine(line);

  return {
    trainId,
    destination: row.DESTINATION?.trim()?.replace(/&#\d+;/g, "") ?? "",
    line,
    lineCode: route ?? "",
    lineAbbrev: route ?? "",
    track: normalizePlatformTrack(row.TRACK?.trim() || null),
    scheduledAt,
    status: row.DIRECTION?.trim() ? row.DIRECTION.trim() : "Scheduled",
    secLate: 0,
  };
}

export function itemMatchesRoute(item: ScheduleDeparture, routeCode: string): boolean {
  const want = routeCode.toUpperCase();
  const candidates = [item.lineAbbrev, item.lineCode, item.line];
  return candidates.some((raw) => canonicalNjRoute(raw) === want);
}

function filterByRoute(items: ScheduleDeparture[], routeCode: string): ScheduleDeparture[] {
  return items.filter((i) => itemMatchesRoute(i, routeCode));
}

function upcomingItems(items: ScheduleDeparture[]): ScheduleDeparture[] {
  return dedupeUpcomingDepartures(items);
}

export async function fetchStationDaySchedule(
  token: string,
  stationCode: string,
  routeCode: string,
): Promise<ScheduleResponse> {
  const stations = await fetchStationList(token);
  const station = stations.find((s) => s.code === stationCode);
  if (!station) {
    return {
      stationCode,
      stationName: stationCode,
      items: [],
      error: "Unknown station code",
    };
  }

  const cacheKey = `${stationCode}:${routeCode.toUpperCase()}`;
  const cached = dayScheduleCache.get(cacheKey);
  if (cached && Date.now() - cached.at < DAY_CACHE_MS) {
    return {
      stationCode,
      stationName: cached.stationName,
      items: upcomingItems(filterByRoute(cached.items, routeCode)),
      error: null,
    };
  }

  const failedUntil = dayFailUntil.get(stationCode) ?? 0;
  if (Date.now() < failedUntil) {
    return fallbackToUpcoming(token, stationCode, station.name, routeCode);
  }

  const form = new FormData();
  form.append("token", token);
  form.append("station", stationCode);

  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getStationSchedule`;
  try {
    const response = await fetch(url, { method: "POST", body: form, cache: "no-store" });
    if (!response.ok) {
      dayFailUntil.set(stationCode, Date.now() + DAY_FAIL_COOLDOWN_MS);
      return fallbackToUpcoming(token, stationCode, station.name, routeCode);
    }

    const body = (await response.json()) as RawDayStation[] | RawDayStation;
    const block = Array.isArray(body) ? body[0] : body;
    const rawItems = block?.ITEMS ?? [];
    const stationName = block?.STATIONNAME?.trim() ?? station.name;
    const allItems = rawItems.map(parseDayItem).filter((i): i is ScheduleDeparture => i != null);

    dayScheduleCache.set(cacheKey, { at: Date.now(), items: allItems, stationName });

    return {
      stationCode,
      stationName,
      items: upcomingItems(filterByRoute(allItems, routeCode)),
      error: null,
    };
  } catch {
    dayFailUntil.set(stationCode, Date.now() + DAY_FAIL_COOLDOWN_MS);
    return fallbackToUpcoming(token, stationCode, station.name, routeCode);
  }
}

async function fallbackToUpcoming(
  token: string,
  stationCode: string,
  stationName: string,
  routeCode: string,
): Promise<ScheduleResponse> {
  const upcoming = await fetchStationSchedule(token, stationCode, null);
  const onLine = filterByRoute(upcoming.items, routeCode);
  return {
    stationCode,
    stationName: upcoming.stationName || stationName,
    items: upcomingItems(onLine),
    error: upcoming.error,
  };
}
