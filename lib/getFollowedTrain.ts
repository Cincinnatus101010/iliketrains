import { getSubwayResponse } from "@/lib/mta/getSubway";
import { getTrainsResponse } from "@/lib/nj/getTrains";
import type { TrainsResponse } from "@/lib/types";

export async function getFollowedTrainResponse(trainId: string): Promise<TrainsResponse> {
  const id = trainId.trim();
  if (!id) {
    return { trains: [], error: "Train id required", configured: true };
  }

  if (id.startsWith("njt-")) {
    const body = await getTrainsResponse();
    const train = body.trains.find((t) => t.id === id);
    return {
      trains: train ? [train] : [],
      error: train ? body.error : (body.error ?? "Train not in live feed"),
      configured: body.configured,
      updatedAt: body.updatedAt,
    };
  }

  if (id.startsWith("mta-")) {
    const body = await getSubwayResponse();
    const train = body.trains.find((t) => t.id === id);
    return {
      trains: train ? [train] : [],
      error: train ? body.error : (body.error ?? "Train not in live feed"),
      configured: body.configured,
      updatedAt: body.updatedAt,
    };
  }

  return { trains: [], error: "Unknown train id", configured: true };
}
