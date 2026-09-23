import type { SubwayResponse } from "@/types";
import { getMtaFeedEntities } from "./feedCache";
import { parseSubwayFeed } from "./parseVehicles";

export async function getSubwayResponse(): Promise<SubwayResponse> {
  try {
    const entities = await getMtaFeedEntities();
    const trains = parseSubwayFeed(entities);
    return {
      trains,
      error: null,
      configured: true,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      trains: [],
      error: e instanceof Error ? e.message : "MTA fetch failed",
      configured: true,
    };
  }
}
