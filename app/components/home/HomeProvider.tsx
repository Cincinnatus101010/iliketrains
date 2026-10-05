"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHomeSession } from "@/hooks/useHomeSession";
import { useHomeUiState } from "@/hooks/useHomeUiState";
import { useIncomingTrainMapHint } from "@/hooks/useIncomingTrainMapHint";
import { useLiveTrainFeeds } from "@/hooks/useLiveTrainFeeds";
import { useLiveTrainFilters } from "@/hooks/useLiveTrainFilters";
import { useMissedPollGrace } from "@/hooks/useMissedPollGrace";
import { useTrackedTrain } from "@/hooks/useTrackedTrain";
import { trainResolvedInMergedFeed } from "@/lib/liveFeeds/filterStaleFollowErrors";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { MAP_VIEW_PADDING } from "@/lib/map/mapViewPadding";
import { mapTopCountLabel } from "@/lib/mapTopCountLabel";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { waitingForChosenTrainLive } from "@/lib/trip/waitingForChosenTrainLive";
import type { HomeContextValue } from "./homeModel";

export type {
  HomeActions,
  HomeContextValue,
  HomeFeed,
  HomeFilters,
  HomeTracking,
  HomeUi,
  HomeViews,
} from "./homeModel";

const HomeContext = createContext<HomeContextValue | null>(null);

export function useHome() {
  const value = useContext(HomeContext);
  if (!value) throw new Error("useHome must be used within HomeProvider");
  return value;
}

export function HomeProvider({ children }: { children: ReactNode }) {
  const ui = useHomeUiState();
  const session = useHomeSession();
  const {
    savedTrip,
    trackingTrainId,
    isTracking,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  } = session;

  const [mapOverviewKey, setMapOverviewKey] = useState(0);
  const feeds = useLiveTrainFeeds({ trackingTrainId, savedTrip });

  const { trackedTrain, trackedTrainLiveKey } = useTrackedTrain(
    feeds.allTrains,
    trackingTrainId,
    savedTrip,
  );

  const waitingForTrackedTrain = waitingForChosenTrainLive(savedTrip, feeds.allTrains);
  const incomingTrain = useIncomingTrainMapHint(savedTrip, feeds.allTrains);

  const filters = useLiveTrainFilters({
    allTrains: feeds.allTrains,
    scope: ui.scope,
    activeLine: ui.activeLine,
    savedTrip,
    trackingTrainId,
    trackedTrain,
    waitingForTrackedTrain,
  });

  const hadTripRef = useRef(false);
  useEffect(() => {
    if (savedTrip) {
      hadTripRef.current = true;
      return;
    }
    if (!hadTripRef.current) return;
    hadTripRef.current = false;
    ui.resetUi();
    setMapOverviewKey((k) => k + 1);
  }, [savedTrip, ui.resetUi]);

  useMissedPollGrace(Boolean(trackingTrainId) && !savedTrip, Boolean(trackedTrain), {
    maxMisses: TRAIN_MISSED_FEED_POLLS,
    onExpire: stopTracking,
  });

  const onTrackTrain = useCallback(
    (trainId: string) => {
      toggleTrackTrain(trainId);
      ui.expandDock();
    },
    [toggleTrackTrain, ui.expandDock],
  );

  const onStartTrip = useCallback(
    (trip: SavedTrip) => {
      startTrip(trip);
      ui.expandDock();
      feeds.refresh();
    },
    [startTrip, ui.expandDock, feeds.refresh],
  );

  const mapApiError = useMemo(() => {
    const err = feeds.apiErrors[0];
    if (!err) return null;
    if (
      /not in live feed/i.test(err) &&
      trainResolvedInMergedFeed(trackingTrainId, feeds.allTrains, savedTrip)
    ) {
      return null;
    }
    return err;
  }, [feeds.apiErrors, trackingTrainId, feeds.allTrains, savedTrip]);

  const highlightLine = waitingForTrackedTrain || filters.chosenLiveEnRoute ? null : ui.activeLine;

  const mapTrackingTrainId = trackedTrain?.id ?? trackingTrainId;

  const value = useMemo<HomeContextValue>(() => {
    const feed = {
      allTrains: feeds.allTrains,
      loading: feeds.loading,
      validating: feeds.validating,
      updatedAt: feeds.updatedAt,
      njConfigured: feeds.njConfigured,
      refresh: feeds.refresh,
      apiError: mapApiError,
    };

    const tracking = {
      savedTrip,
      trackingTrainId,
      mapTrackingTrainId,
      trackedTrain,
      trackedTrainLiveKey,
      incomingTrain,
      isTracking,
    };

    const actions = { onTrackTrain, onStartTrip, stopTracking, endTrip };

    const views = {
      topBar: {
        linesOpen: ui.linesOpen,
        onOpenLines: ui.openLines,
        activeLine: ui.activeLine,
        bottomCollapsed: ui.bottomCollapsed,
        onToggleBottom: () => ui.setBottomCollapsed((c) => !c),
        savedTrip,
        validating: feed.validating,
        countLabel: mapTopCountLabel(filters.mapLiveCount, { isTracking, savedTrip }),
      },
      map: {
        trains: filters.visibleTrains,
        trainsSignature: filters.mapTrainsSignature,
        highlightLine,
        tripTrackFocus: filters.tripTrackFocus,
        incomingTrain,
        padding: MAP_VIEW_PADDING,
        plannedRoute: filters.plannedRouteCoords,
        plannedRouteFitKey: filters.plannedRouteFitKey,
        tripHighlightTrainIds: filters.tripHighlightTrainIds,
        tripHighlightKey: filters.tripHighlightKey,
        trackingTrainId: mapTrackingTrainId,
        trackingTrainLiveKey: trackedTrainLiveKey,
        overviewKey: mapOverviewKey,
        onTrackTrain,
        onStopTracking: stopTracking,
      },
      mapOverlays: {
        njConfigured: feed.njConfigured,
        apiError: feed.apiError,
        navOpen: ui.navOpen,
        onOpenNav: ui.openNav,
      },
      dock: {
        allTrains: feed.allTrains,
        trains: filters.scopedTrains,
        loading: feed.loading,
        validating: feed.validating,
        updatedAt: feed.updatedAt,
        activeLine: ui.activeLine,
        onRefresh: feed.refresh,
        savedTrip,
        tripHighlightTrainIds: filters.tripHighlightTrainIds,
        trackingTrainId,
        onTrackTrain,
        onEditTrip: ui.openNav,
        onEndTrip: endTrip,
        onStopTracking: stopTracking,
        trackedTrain,
        incomingTrain,
      },
      lines: {
        open: ui.linesOpen,
        onClose: ui.closeLines,
        scope: ui.scope,
        onScopeChange: ui.onScopeChange,
        activeLine: ui.activeLine,
        onSelectLine: ui.setActiveLine,
        counts: filters.lineCounts,
      },
      nav: {
        open: ui.navOpen,
        onClose: ui.closeNav,
        initialTrip: savedTrip,
        onStartTrip,
        onEndTrip: endTrip,
      },
    };

    return { ui, feed, tracking, filters, actions, views };
  }, [
    ui,
    feeds,
    filters,
    savedTrip,
    trackingTrainId,
    isTracking,
    trackedTrain,
    trackedTrainLiveKey,
    incomingTrain,
    mapOverviewKey,
    mapApiError,
    highlightLine,
    mapTrackingTrainId,
    onTrackTrain,
    onStartTrip,
    stopTracking,
    endTrip,
  ]);

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}
