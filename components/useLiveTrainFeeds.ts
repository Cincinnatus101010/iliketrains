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
import { pickLatestUpdatedAt } from "@/lib/pickLatestUpdatedAt";
import type { LiveTrain } from "@/lib/types";

type UseLiveTrainFeedsOptions = {
  trackingTrainId: string | null;
  isTracking: boolean;
};

function forceRevalidate<T>(mutate: MutateFn<T>, fallback: T) {
  void mutate((current) => current ?? fallback, { revalidate: true });
}

export function useLiveTrainFeeds({ trackingTrainId, isTracking }: UseLiveTrainFeedsOptions) {
  const followKey = trackingTrainId ? followedTrainKey(trackingTrainId) : null;

  const {
    data: njData,
    error: njError,
    isLoading: njLoading,
    isValidating: njValidating,
    mutate: mutateNj,
  } = useSteddy(isTracking ? null : NJ_TRAINS_KEY, fetchNjTrains, {
    staleTime: NJ_TRAINS_POLL_MS,
    refetchInterval: NJ_TRAINS_POLL_MS,
  });

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
    mutate: mutateSubway,
  } = useSteddy(isTracking ? null : SUBWAY_TRAINS_KEY, fetchSubwayTrains, {
    staleTime: SUBWAY_TRAINS_POLL_MS,
    refetchInterval: SUBWAY_TRAINS_POLL_MS,
  });

  const {
    data: followData,
    error: followError,
    isLoading: followLoading,
    isValidating: followValidating,
    mutate: mutateFollow,
  } = useSteddy(followKey, fetchFollowedTrain, {
    staleTime: FOLLOWED_TRAIN_POLL_MS,
    refetchInterval: FOLLOWED_TRAIN_POLL_MS,
  });

  const refresh = useCallback(() => {
    if (trackingTrainId) {
      forceRevalidate(mutateFollow, EMPTY_TRAINS_RESPONSE);
      return;
    }
    forceRevalidate(mutateNj, EMPTY_TRAINS_RESPONSE);
    forceRevalidate(mutateSubway, EMPTY_TRAINS_RESPONSE);
  }, [trackingTrainId, mutateFollow, mutateNj, mutateSubway]);

  const allTrains = useMemo((): LiveTrain[] => {
    if (isTracking) return followData?.trains ?? [];
    const nj = njData?.trains ?? [];
    const subway = subwayData?.trains ?? [];
    return [...subway, ...nj];
  }, [isTracking, followData?.trains, njData?.trains, subwayData?.trains]);

  const apiErrors = useMemo(
    () =>
      isTracking
        ? collectFetchErrors(followData?.error, followError)
        : collectFetchErrors(njData?.error, subwayData?.error, njError, subwayError),
    [
      isTracking,
      followData?.error,
      followError,
      njData?.error,
      subwayData?.error,
      njError,
      subwayError,
    ],
  );

  const njConfigured = isTracking ? (followData?.configured ?? true) : (njData?.configured ?? true);
  const loading = isTracking ? followLoading : njLoading || subwayLoading;
  const validating = isTracking ? followValidating : njValidating || subwayValidating;
  const updatedAt = isTracking
    ? followData?.updatedAt
    : pickLatestUpdatedAt(njData?.updatedAt, subwayData?.updatedAt);

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
