import { collectFetchErrors } from "@/lib/collectFetchErrors";
import { mergeLiveTrains } from "@/lib/mergeLiveTrains";
import { pickLatestUpdatedAt } from "@/lib/pickLatestUpdatedAt";
import type { LiveFeedResponse, LiveTrain } from "@/types";

export type LiveFeedQueryResult = {
  data?: LiveFeedResponse | null;
  transportError?: unknown;
};

export type AggregatedLiveFeeds = {
  allTrains: LiveTrain[];
  apiErrors: string[];
  njConfigured: boolean;
  updatedAt?: string;
};

export function aggregateLiveFeeds(
  mta: LiveFeedQueryResult,
  nj: LiveFeedQueryResult,
  follow: LiveFeedQueryResult | null,
): AggregatedLiveFeeds {
  const allTrains = mergeLiveTrains(
    mta.data?.trains ?? [],
    nj.data?.trains ?? [],
    follow?.data?.trains,
  );

  const apiErrors = collectFetchErrors(
    nj.data?.error,
    mta.data?.error,
    nj.transportError,
    mta.transportError,
    follow?.data?.error,
    follow?.transportError,
  );

  return {
    allTrains,
    apiErrors,
    njConfigured: nj.data?.configured ?? true,
    updatedAt: pickLatestUpdatedAt(
      nj.data?.updatedAt,
      mta.data?.updatedAt,
      follow?.data?.updatedAt,
    ),
  };
}
