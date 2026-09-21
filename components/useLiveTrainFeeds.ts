"use client";

import { useCallback, useMemo } from "react";
import { type MutateFn, useSteddy } from "steddy";
import { collectFetchErrors } from "@/lib/collectFetchErrors";
import { fetchFollowedTrain } from "@/lib/fetchFollowedTrain";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import {
  EMPTY_TRAINS_RESPONSE,
  FOLLOWED_TRAIN_POLL_MS,
  followedTrainKey,
  NJ_TRAINS_KEY,
  NJ_TRAINS_POLL_MS,
  SUBWAY_TRAINS_KEY,
  SUBWAY_TRAINS_POLL_MS,
} from "@/lib/liveFeedConfig";
import { mergeLiveTrains } from "@/lib/mergeLiveTrains";
import { pickLatestUpdatedAt } from "@/lib/pickLatestUpdatedAt";
import type { LiveTrain } from "@/lib/types";

type UseLiveTrainFeedsOptions = {
  trackingTrainId: string | null;
};

function forceRevalidate<T>(mutate: MutateFn<T>, fallback: T) {
  void mutate((current) => current ?? fallback, { revalidate: true });
}

export function useLiveTrainFeeds({ trackingTrainId }: UseLiveTrainFeedsOptions) {
  const followKey = trackingTrainId ? followedTrainKey(trackingTrainId) : null;

  const {
    data: njData,
    error: njError,
    isLoading: njLoading,
    isValidating: njValidating,
    mutate: mutateNj,
  } = useSteddy(NJ_TRAINS_KEY, fetchNjTrains, {
    staleTime: NJ_TRAINS_POLL_MS,
    refetchInterval: NJ_TRAINS_POLL_MS,
  });

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
    mutate: mutateSubway,
  } = useSteddy(SUBWAY_TRAINS_KEY, fetchSubwayTrains, {
    staleTime: SUBWAY_TRAINS_POLL_MS,
    refetchInterval: SUBWAY_TRAINS_POLL_MS,
  });

  const {
    data: followData,
    error: followError,
    isValidating: followValidating,
    mutate: mutateFollow,
  } = useSteddy(followKey, fetchFollowedTrain, {
    staleTime: FOLLOWED_TRAIN_POLL_MS,
    refetchInterval: FOLLOWED_TRAIN_POLL_MS,
  });

  const refresh = useCallback(() => {
    forceRevalidate(mutateNj, EMPTY_TRAINS_RESPONSE);
    forceRevalidate(mutateSubway, EMPTY_TRAINS_RESPONSE);
    if (trackingTrainId) forceRevalidate(mutateFollow, EMPTY_TRAINS_RESPONSE);
  }, [trackingTrainId, mutateFollow, mutateNj, mutateSubway]);

  const allTrains = useMemo(
    (): LiveTrain[] =>
      mergeLiveTrains(subwayData?.trains ?? [], njData?.trains ?? [], followData?.trains),
    [followData?.trains, njData?.trains, subwayData?.trains],
  );

  const apiErrors = useMemo(
    () =>
      collectFetchErrors(
        njData?.error,
        subwayData?.error,
        njError,
        subwayError,
        followData?.error,
        followError,
      ),
    [followData?.error, followError, njData?.error, subwayData?.error, njError, subwayError],
  );

  const njConfigured = njData?.configured ?? true;
  const loading = njLoading || subwayLoading;
  const validating = njValidating || subwayValidating || followValidating;
  const updatedAt = pickLatestUpdatedAt(
    njData?.updatedAt,
    subwayData?.updatedAt,
    followData?.updatedAt,
  );

  return {
    allTrains,
    apiErrors,
    njConfigured,
    loading,
    validating,
    updatedAt,
    refresh,
  };
}
