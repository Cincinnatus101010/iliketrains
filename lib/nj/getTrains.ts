import { config, njConfigured } from "./config";
import { getLastTokenError, getNjToken } from "./tokenService";
import { parseVehicle } from "./parseVehicles";
import { enrichLiveTrainsWithTracks } from "./enrichTracks";
import { withTrainsCache } from "./getTrainsCache";
import type { TrainsResponse } from "@/lib/types";

export async function getTrainsResponse(): Promise<TrainsResponse> {
  return withTrainsCache(fetchTrainsFresh);
}

async function fetchTrainsFresh(): Promise<TrainsResponse> {
  if (!njConfigured) {
    return {
      trains: [],
      error: "Set NJTRANSIT_USERNAME and NJTRANSIT_PASSWORD in .env.local",
      configured: false,
    };
  }

  const token = await getNjToken(config.njUsername, config.njPassword, config.tokenUrl);
  if (!token) {
    return {
      trains: [],
      error: getLastTokenError(),
      configured: true,
    };
  }

  const form = new FormData();
  form.append("token", token);
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/getVehicleData`;

  try {
    const response = await fetch(url, { method: "POST", body: form, cache: "no-store" });
    if (!response.ok) {
      return {
        trains: [],
        error: `getVehicleData HTTP ${response.status}`,
        configured: true,
      };
    }

    const rows = (await response.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) {
      return { trains: [], error: "Unexpected vehicle payload", configured: true };
    }

    let trains = rows.map(parseVehicle).filter((t): t is NonNullable<typeof t> => t != null);
    trains = await enrichLiveTrainsWithTracks(trains, token);
    return {
      trains,
      error: null,
      configured: true,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      trains: [],
      error: e instanceof Error ? e.message : "Fetch failed",
      configured: true,
    };
  }
}
