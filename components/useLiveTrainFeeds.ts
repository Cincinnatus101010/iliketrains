"use client";

import { useCallback, useMemo } from "react";
import { serializeKey, useSteddy, useSteddyRuntime } from "steddy";
import { collectFetchErrors } from "@/lib/collectFetchErrors";
import { fetchFollowedTrain } from "@/lib/fetchFollowedTrain";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import { pickLatestUpdatedAt } from "@/lib/pickLatestUpdatedAt";
import type { LiveTrain } from "@/lib/types";

const NJ_KEY = ["nj-trains"] as const;
const SUBWAY_KEY = ["subway-trains"] as const;
const NJ_POLL_MS = 20_000;
const SUBWAY_POLL_MS = 5_000;
const FOLLOW_POLL_MS = 5_000;

type UseLiveTrainFeedsOptions = {
  trackingTrainId: string | null;
  isOnboard: boolean;
};

export function useLiveTrainFeeds({ trackingTrainId, isOnboard }: UseLiveTrainFeedsOptions) {
  const { coordinator } = useSteddyRuntime();
  const followKey = trackingTrainId ? (["followed-train", trackingTrainId] as const) : null;

  const {
    data: njData,
    error: njError,
    isLoading: njLoading,
    isValidating: njValidating,
  } = useSteddy(isOnboard ? null : NJ_KEY, fetchNjTrains, {
    staleTime: NJ_POLL_MS,
    refetchInterval: NJ_POLL_MS,
  });

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
  } = useSteddy(isOnboard ? null : SUBWAY_KEY, fetchSubwayTrains, {
    staleTime: SUBWAY_POLL_MS,
    refetchInterval: SUBWAY_POLL_MS,
  });

  const {
    data: followData,
    error: followError,
    isLoading: followLoading,
    isValidating: followValidating,
  } = useSteddy(followKey, fetchFollowedTrain, {
    staleTime: FOLLOW_POLL_MS,
    refetchInterval: FOLLOW_POLL_MS,
  });

  const refresh = useCallback(() => {
    if (trackingTrainId) {
      void coordinator.revalidate(
        serializeKey(["followed-train", trackingTrainId]),
        fetchFollowedTrain,
        { force: true },
      );
      return;
    }
    void coordinator.revalidate(serializeKey(NJ_KEY), fetchNjTrains, { force: true });
    void coordinator.revalidate(serializeKey(SUBWAY_KEY), fetchSubwayTrains, { force: true });
  }, [coordinator, trackingTrainId]);

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
