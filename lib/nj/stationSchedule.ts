import type { ScheduleDeparture, ScheduleResponse } from "@/lib/types";
import { config } from "./config";
import { routeFromApiLine } from "./njRoutes";
import { normalizePlatformTrack } from "./platformTrack";
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
/** API allows ~10 station-schedule calls/day — cache aggressively. */
const DAY_CACHE_MS = 4 * 60 * 60 * 1000;

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

function parseScheduleDate(raw: string): Date {
  return new Date(raw.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
}

function filterByRoute(items: ScheduleDeparture[], routeCode: string): ScheduleDeparture[] {
  const want = routeCode.toUpperCase();
  return items.filter((i) => i.lineAbbrev.toUpperCase() === want);
}

function upcomingItems(items: ScheduleDeparture[]): ScheduleDeparture[] {
  const cutoff = Date.now() - 2 * 60 * 1000;
  return items
    .filter((i) => parseScheduleDate(i.scheduledAt).getTime() >= cutoff)
    .sort(
      (a, b) =>
        parseScheduleDate(a.scheduledAt).getTime() - parseScheduleDate(b.scheduledAt).getTime(),
    );
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

  const form = new FormData();
  form.append("token", token);
  form.append("station", stationCode);

  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getStationSchedule`;
  const response = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  if (!response.ok) {
    return {
      stationCode,
      stationName: station.name,
      items: [],
      error: `Station schedule HTTP ${response.status}`,
    };
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
}
