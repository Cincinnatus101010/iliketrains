import { getSubwayResponse } from "@/lib/mta/getSubway";
import { getTrainsResponse } from "@/lib/nj/getTrains";
import type { TrainsResponse } from "@/lib/types";

function followedFromFeed(body: TrainsResponse, id: string): TrainsResponse {
  const train = body.trains.find((t) => t.id === id);
  return {
    trains: train ? [train] : [],
    error: train ? body.error : (body.error ?? "Train not in live feed"),
    configured: body.configured,
    updatedAt: body.updatedAt,
  };
}

export async function getFollowedTrainResponse(trainId: string): Promise<TrainsResponse> {
  const id = trainId.trim();
  if (!id) {
    return { trains: [], error: "Train id required", configured: true };
  }

  if (id.startsWith("njt-")) {
    return followedFromFeed(await getTrainsResponse(), id);
  }

  if (id.startsWith("mta-")) {
    return followedFromFeed(await getSubwayResponse(), id);
  }

  return { trains: [], error: "Unknown train id", configured: true };
}
