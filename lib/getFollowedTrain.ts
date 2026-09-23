import { getLiveFeedResponse, liveFeedNetworkForTrainId } from "@/lib/liveFeeds/server";
import { findNjTrainByFollowId } from "@/lib/trip/chosenDepartureLiveMatch";
import type { LiveFeedResponse } from "@/types";

function followedFromFeed(body: LiveFeedResponse, id: string): LiveFeedResponse {
  const train =
    body.trains.find((t) => t.id === id) ?? findNjTrainByFollowId(id, body.trains) ?? undefined;
  return {
    trains: train ? [train] : [],
    error: train ? body.error : (body.error ?? "Train not in live feed"),
    configured: body.configured,
    updatedAt: body.updatedAt,
  };
}

export async function getFollowedTrainResponse(trainId: string): Promise<LiveFeedResponse> {
  const id = trainId.trim();
  if (!id) {
    return { trains: [], error: "Train id required", configured: true };
  }

  const network = liveFeedNetworkForTrainId(id);
  if (!network) {
    return { trains: [], error: "Unknown train id", configured: true };
  }

  return followedFromFeed(await getLiveFeedResponse(network), id);
}
