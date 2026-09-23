"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveTrainFeeds } from "@/hooks/useLiveTrainFeeds";
import { useMissedPollGrace } from "@/hooks/useMissedPollGrace";
import { useTrackedTrain } from "@/hooks/useTrackedTrain";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { MAP_VIEW_PADDING } from "@/lib/map/mapViewPadding";
import { mapTopCountLabel } from "@/lib/mapTopCountLabel";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapPaneOverlays } from "./MapPaneOverlays";
import { MapTopControls } from "./MapTopControls";
import { useHomeSession } from "./useHomeSession";
import { useHomeUiState } from "./useHomeUiState";
import { useLiveTrainFilters } from "./useLiveTrainFilters";

const NavigationSheet = dynamic(() => import("./NavigationSheet").then((m) => m.NavigationSheet), {
  ssr: false,
});

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

export function HomeClient() {
  const {
    scope,
    activeLine,
    setActiveLine,
    onScopeChange: handleScopeChange,
    navOpen,
    openNav,
    closeNav,
    linesOpen,
    openLines,
    closeLines,
    bottomCollapsed,
    setBottomCollapsed,
    expandDock,
    resetUi,
  } = useHomeUiState();

  const {
    savedTrip,
    trackingTrainId,
    isTracking,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  } = useHomeSession();

  const [mapOverviewKey, setMapOverviewKey] = useState(0);

  const { allTrains, apiErrors, njConfigured, loading, validating, updatedAt, refresh } =
    useLiveTrainFeeds({ trackingTrainId });

  const {
    scopedTrains,
    visibleTrains,
    mapLiveCount,
    mapTrainsSignature,
    tripHighlightTrainIds,
    tripHighlightKey,
    plannedRouteCoords,
    plannedRouteFitKey,
    lineCounts,
  } = useLiveTrainFilters({
    allTrains,
    scope,
    activeLine,
    savedTrip,
    trackingTrainId,
  });

  const { trackedTrain, trackedTrainLiveKey } = useTrackedTrain(allTrains, trackingTrainId);

  const hadTripRef = useRef(false);
  useEffect(() => {
    if (savedTrip) {
      hadTripRef.current = true;
      return;
    }
    if (!hadTripRef.current) return;
    hadTripRef.current = false;
    resetUi();
    setMapOverviewKey((key) => key + 1);
  }, [savedTrip, resetUi]);

  const handleFollowExpired = useCallback(() => {
    if (savedTrip) endTrip();
    else stopTracking();
  }, [savedTrip, endTrip, stopTracking]);

  useMissedPollGrace(Boolean(trackingTrainId), Boolean(trackedTrain), {
    maxMisses: TRAIN_MISSED_FEED_POLLS,
    onExpire: handleFollowExpired,
  });

  const handleTrackTrain = useCallback(
    (trainId: string) => {
      toggleTrackTrain(trainId);
      expandDock();
    },
    [toggleTrackTrain, expandDock],
  );

  const handleStartTrip = useCallback(
    (trip: Parameters<typeof startTrip>[0]) => {
      startTrip(trip);
      expandDock();
    },
    [startTrip, expandDock],
  );

  const countLabel = mapTopCountLabel(mapLiveCount, { isTracking, savedTrip });

  return (
    <div
      className={`app-frame troisi-root ${bottomCollapsed ? "app-frame--bottom-collapsed" : ""}`}
    >
      <MapTopControls
        linesOpen={linesOpen}
        onOpenLines={openLines}
        activeLine={activeLine}
        bottomCollapsed={bottomCollapsed}
        onToggleBottom={() => setBottomCollapsed((c) => !c)}
        savedTrip={savedTrip}
        validating={validating}
        countLabel={countLabel}
      />

      <section className="map-pane" aria-label="Map">
        <NjLiveMap
          trains={visibleTrains}
          trainsSignature={mapTrainsSignature}
          highlightLine={activeLine}
          padding={MAP_VIEW_PADDING}
          plannedRoute={plannedRouteCoords}
          plannedRouteFitKey={plannedRouteFitKey}
          tripHighlightTrainIds={tripHighlightTrainIds}
          tripHighlightKey={tripHighlightKey}
          trackingTrainId={trackingTrainId}
          trackingTrainLiveKey={trackedTrainLiveKey}
          overviewKey={mapOverviewKey}
          onTrackTrain={handleTrackTrain}
          onStopTracking={stopTracking}
        />

        <MapPaneOverlays
          njConfigured={njConfigured}
          apiError={apiErrors[0] ?? null}
          navOpen={navOpen}
          onOpenNav={openNav}
        />
      </section>

      <section className="bottom-pane glass" aria-label="Live trains">
        {!bottomCollapsed && (
          <DockPanel
            trains={scopedTrains}
            loading={loading}
            validating={validating}
            updatedAt={updatedAt}
            activeLine={activeLine}
            onRefresh={refresh}
            savedTrip={savedTrip}
            tripHighlightTrainIds={tripHighlightTrainIds}
            trackingTrainId={trackingTrainId}
            onTrackTrain={handleTrackTrain}
            onEditTrip={openNav}
            onEndTrip={endTrip}
            onStopTracking={stopTracking}
            trackedTrain={trackedTrain}
          />
        )}
      </section>

      <LinesFilterDrawer
        open={linesOpen}
        onClose={closeLines}
        scope={scope}
        onScopeChange={handleScopeChange}
        activeLine={activeLine}
        onSelectLine={setActiveLine}
        counts={lineCounts}
      />

      <NavigationSheet
        open={navOpen}
        onClose={closeNav}
        initialTrip={savedTrip}
        onStartTrip={handleStartTrip}
        onEndTrip={endTrip}
      />
    </div>
  );
}
