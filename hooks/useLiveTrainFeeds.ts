"use client";

import { useCallback, useMemo } from "react";
import { type MutateFn, useSteddy } from "steddy";
import {
  aggregateLiveFeeds,
  EMPTY_LIVE_FEED,
  FOLLOWED_TRAIN_POLL_MS,
  fetchFollowedLiveFeed,
  fetchMtaLiveFeed,
  fetchNjLiveFeed,
  followedTrainKey,
  MTA_LIVE_FEED_KEY,
  MTA_LIVE_FEED_POLL_MS,
  NJ_LIVE_FEED_KEY,
  NJ_LIVE_FEED_POLL_MS,
} from "@/lib/liveFeeds";

type UseLiveTrainFeedsOptions = {
  trackingTrainId: string | null;
};

function forceRevalidate<T>(mutate: MutateFn<T>, fallback: T) {
  void mutate((current) => current ?? fallback, { revalidate: true });
}

export function useLiveTrainFeeds({ trackingTrainId }: UseLiveTrainFeedsOptions) {
  const followKey = trackingTrainId ? followedTrainKey(trackingTrainId) : null;

  const nj = useSteddy(NJ_LIVE_FEED_KEY, fetchNjLiveFeed, {
    staleTime: NJ_LIVE_FEED_POLL_MS,
    refetchInterval: NJ_LIVE_FEED_POLL_MS,
  });

  const mta = useSteddy(MTA_LIVE_FEED_KEY, fetchMtaLiveFeed, {
    staleTime: MTA_LIVE_FEED_POLL_MS,
    refetchInterval: MTA_LIVE_FEED_POLL_MS,
  });

  const follow = useSteddy(followKey, fetchFollowedLiveFeed, {
    staleTime: FOLLOWED_TRAIN_POLL_MS,
    refetchInterval: FOLLOWED_TRAIN_POLL_MS,
  });

  const { allTrains, apiErrors, njConfigured, updatedAt } = useMemo(
    () =>
      aggregateLiveFeeds(
        { data: mta.data, transportError: mta.error },
        { data: nj.data, transportError: nj.error },
        followKey ? { data: follow.data, transportError: follow.error } : null,
      ),
    [follow.data, follow.error, followKey, mta.data, mta.error, nj.data, nj.error],
  );

  const refresh = useCallback(() => {
    forceRevalidate(nj.mutate, EMPTY_LIVE_FEED);
    forceRevalidate(mta.mutate, EMPTY_LIVE_FEED);
    if (trackingTrainId) forceRevalidate(follow.mutate, EMPTY_LIVE_FEED);
  }, [trackingTrainId, follow.mutate, mta.mutate, nj.mutate]);

  return {
    allTrains,
    apiErrors,
    njConfigured,
    loading: nj.isLoading || mta.isLoading,
    validating: nj.isValidating || mta.isValidating || follow.isValidating,
    updatedAt,
    refresh,
  };
}
