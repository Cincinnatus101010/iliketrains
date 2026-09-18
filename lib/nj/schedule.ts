import type { ScheduleDeparture, ScheduleResponse } from "@/lib/types";
import { config } from "./config";
import { fetchStationList } from "./stations";

type RawScheduleItem = {
  SCHED_DEP_DATE?: string;
  DESTINATION?: string;
  TRACK?: string;
  LINE?: string;
  TRAIN_ID?: string;
  STATUS?: string;
  SEC_LATE?: string;
  LINECODE?: string;
  LINEABBREVIATION?: string;
};

type RawSchedulePayload = {
  STATION_2CHAR?: string;
  STATIONNAME?: string;
  ITEMS?: RawScheduleItem[];
};

function parseItem(row: RawScheduleItem): ScheduleDeparture {
  const secLate = Number.parseInt(row.SEC_LATE ?? "0", 10);
  return {
    trainId: row.TRAIN_ID?.trim() ?? "",
    destination: row.DESTINATION?.trim() ?? "",
    line: row.LINE?.trim() ?? "",
    lineCode: row.LINECODE?.trim() ?? "",
    lineAbbrev: row.LINEABBREVIATION?.trim() ?? "",
    track: row.TRACK?.trim() || null,
    scheduledAt: row.SCHED_DEP_DATE?.trim() ?? "",
    status: row.STATUS?.trim() ?? "",
    secLate: Number.isFinite(secLate) ? secLate : 0,
  };
}

export async function fetchStationSchedule(
  token: string,
  stationCode: string,
  lineCode?: string | null,
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

  const form = new FormData();
  form.append("token", token);
  form.append("station", stationCode);
  if (lineCode?.trim()) {
    form.append("line", lineCode.trim());
  }

  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getTrainSchedule19Rec`;
  const response = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  if (!response.ok) {
    return {
      stationCode,
      stationName: station.name,
      items: [],
      error: `Schedule HTTP ${response.status}`,
    };
  }

  const body = (await response.json()) as RawSchedulePayload;
  const items = (body.ITEMS ?? []).map(parseItem).filter((i) => i.trainId);

  return {
    stationCode,
    stationName: body.STATIONNAME?.trim() ?? station.name,
    items,
    error: null,
  };
}

function normalizeTrainId(id: string): string {
  const trimmed = id.trim();
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num)) return String(num);
  return trimmed;
}

export function matchPlatformTrack(
  trainNumber: string | null | undefined,
  items: ScheduleDeparture[],
): string | null {
  if (!trainNumber?.trim()) return null;
  const id = normalizeTrainId(trainNumber);
  const hit = items.find((i) => normalizeTrainId(i.trainId) === id);
  return hit?.track ?? null;
}
