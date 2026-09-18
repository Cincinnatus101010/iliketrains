import { config, njConfigured } from "./config";
import { getLastTokenError, getNjToken } from "./tokenService";
import { fetchStationList } from "./stations";
import type { NjStation } from "@/lib/types";

export async function getStationsResponse(): Promise<{ stations: NjStation[]; error: string | null }> {
  if (!njConfigured) {
    return { stations: [], error: "Credentials not configured" };
  }

  const token = await getNjToken(config.njUsername, config.njPassword, config.tokenUrl);
  if (!token) {
    return { stations: [], error: getLastTokenError() };
  }

  try {
    const stations = await fetchStationList(token);
    return { stations, error: null };
  } catch (e) {
    return { stations: [], error: e instanceof Error ? e.message : "Failed to load stations" };
  }
}
