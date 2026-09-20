"use client";

import { useCallback, useMemo } from "react";
import { type MutateFn, useSteddy } from "steddy";
import { collectFetchErrors } from "@/lib/collectFetchErrors";
import { fetchFollowedTrain } from "@/lib/fetchFollowedTrain";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import { pickLatestUpdatedAt } from "@/lib/pickLatestUpdatedAt";
import type { LiveTrain, TrainsResponse } from "@/lib/types";

const NJ_KEY = ["nj-trains"] as const;
const SUBWAY_KEY = ["subway-trains"] as const;
const NJ_POLL_MS = 20_000;
const SUBWAY_POLL_MS = 5_000;
const FOLLOW_POLL_MS = 5_000;

type UseLiveTrainFeedsOptions = {
  trackingTrainId: string | null;
  isOnboard: boolean;
};

function forceRevalidate<T>(mutate: MutateFn<T>, fallback: T) {
  void mutate((current) => current ?? fallback, { revalidate: true });
}

const EMPTY_TRAINS: TrainsResponse = { trains: [], error: null, configured: true };

export function useLiveTrainFeeds({ trackingTrainId, isOnboard }: UseLiveTrainFeedsOptions) {
  const followKey = trackingTrainId ? (["followed-train", trackingTrainId] as const) : null;

  const {
    data: njData,
    error: njError,
    isLoading: njLoading,
    isValidating: njValidating,
    mutate: mutateNj,
  } = useSteddy(isOnboard ? null : NJ_KEY, fetchNjTrains, {
    staleTime: NJ_POLL_MS,
    refetchInterval: NJ_POLL_MS,
  });

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
    mutate: mutateSubway,
  } = useSteddy(isOnboard ? null : SUBWAY_KEY, fetchSubwayTrains, {
    staleTime: SUBWAY_POLL_MS,
    refetchInterval: SUBWAY_POLL_MS,
  });

  const {
    data: followData,
    error: followError,
    isLoading: followLoading,
    isValidating: followValidating,
    mutate: mutateFollow,
  } = useSteddy(followKey, fetchFollowedTrain, {
    staleTime: FOLLOW_POLL_MS,
    refetchInterval: FOLLOW_POLL_MS,
  });

  const refresh = useCallback(() => {
    if (trackingTrainId) {
      forceRevalidate(mutateFollow, EMPTY_TRAINS);
      return;
    }
    forceRevalidate(mutateNj, EMPTY_TRAINS);
    forceRevalidate(mutateSubway, EMPTY_TRAINS);
  }, [trackingTrainId, mutateFollow, mutateNj, mutateSubway]);

  const allTrains = useMemo((): LiveTrain[] => {
    if (isOnboard) return followData?.trains ?? [];
    const nj = njData?.trains ?? [];
    const subway = subwayData?.trains ?? [];
    return [...subway, ...nj];
  }, [isOnboard, followData?.trains, njData?.trains, subwayData?.trains]);

  const apiErrors = useMemo(
    () =>
      isOnboard
        ? collectFetchErrors(followData?.error, followError)
        : collectFetchErrors(njData?.error, subwayData?.error, njError, subwayError),
    [
      isOnboard,
      followData?.error,
      followError,
      njData?.error,
      subwayData?.error,
      njError,
      subwayError,
    ],
  );

  const njConfigured = isOnboard ? (followData?.configured ?? true) : (njData?.configured ?? true);
  const loading = isOnboard ? followLoading : njLoading || subwayLoading;
  const validating = isOnboard ? followValidating : njValidating || subwayValidating;
  const updatedAt = isOnboard
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
