import type { ScheduleResponse } from "@/lib/types";
import { config, njConfigured } from "./config";
import { fetchStationSchedule } from "./schedule";
import { fetchStationDaySchedule } from "./stationSchedule";
import { getLastTokenError, getNjToken } from "./tokenService";

export async function getScheduleResponse(
  stationCode: string,
  lineCode?: string | null,
): Promise<ScheduleResponse> {
  if (!stationCode.trim()) {
    return { stationCode: "", stationName: "", items: [], error: "Station required" };
  }

  if (!njConfigured) {
    return {
      stationCode,
      stationName: "",
      items: [],
      error: "Set NJTRANSIT_USERNAME and NJTRANSIT_PASSWORD in .env.local",
    };
  }

  const token = await getNjToken(config.njUsername, config.njPassword, config.tokenUrl);
  if (!token) {
    return { stationCode, stationName: "", items: [], error: getLastTokenError() };
  }

  if (lineCode?.trim()) {
    return fetchStationDaySchedule(token, stationCode.trim(), lineCode.trim());
  }

  return fetchStationSchedule(token, stationCode.trim(), null);
}
