import { getSubwayResponse } from "@/lib/mta/getSubway";
import { getTrainsResponse } from "@/lib/nj/getTrains";
import type { LiveFeedResponse, LiveTrain, Network } from "@/types";
import { aggregateLiveFeeds } from "./aggregate";

export async function getLiveFeedResponse(network: Network): Promise<LiveFeedResponse> {
  if (network === "njt") return getTrainsResponse();
  if (network === "mta") return getSubwayResponse();
  throw new Error(`No live feed for network: ${network}`);
}

/** Server-side merge of bulk NJT + MTA feeds (same train list logic as the client hook). */
export async function getMergedLiveTrains(): Promise<{
  trains: LiveTrain[];
  errors: string[];
  njConfigured: boolean;
  updatedAt?: string;
}> {
  const [nj, mta] = await Promise.all([getTrainsResponse(), getSubwayResponse()]);
  const aggregated = aggregateLiveFeeds({ data: mta }, { data: nj }, null);
  return {
    trains: aggregated.allTrains,
    errors: aggregated.apiErrors,
    njConfigured: aggregated.njConfigured,
    updatedAt: aggregated.updatedAt,
  };
}

export function liveFeedNetworkForTrainId(trainId: string): Network | null {
  const id = trainId.trim();
  if (id.startsWith("njt-")) return "njt";
  if (id.startsWith("mta-")) return "mta";
  return null;
}
