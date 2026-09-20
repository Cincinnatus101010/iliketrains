"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { MAP_VIEW_PADDING } from "@/lib/map/mapViewPadding";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapContextCard } from "./MapContextCard";
import { MapPaneOverlays } from "./MapPaneOverlays";
import { MapTopControls } from "./MapTopControls";
import { useHomeSession } from "./useHomeSession";
import { useHomeUiState } from "./useHomeUiState";
import { useLiveTrainFeeds } from "./useLiveTrainFeeds";
import { useLiveTrainFilters } from "./useLiveTrainFilters";
import { useMissedPollGrace } from "./useMissedPollGrace";
import { useTrackedTrain } from "./useTrackedTrain";

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
  } = useHomeUiState();

  const {
    savedTrip,
    trackingTrainId,
    isOnboard,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  } = useHomeSession();

  const { allTrains, apiErrors, njConfigured, loading, validating, updatedAt, refresh } =
    useLiveTrainFeeds({ trackingTrainId, isOnboard });

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
    isOnboard,
    trackingTrainId,
  });

  const { trackedTrain, trackedTrainLiveKey } = useTrackedTrain(allTrains, trackingTrainId);

  useMissedPollGrace(Boolean(trackingTrainId), Boolean(trackedTrain), {
    maxMisses: TRAIN_MISSED_FEED_POLLS,
    onExpire: stopTracking,
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

  const countLabel = isOnboard
    ? "On train"
    : savedTrip
      ? `${mapLiveCount} on route`
      : `${mapLiveCount} live`;

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
          onTrackTrain={handleTrackTrain}
          onStopTracking={stopTracking}
        />

        <MapPaneOverlays
          njConfigured={njConfigured}
          apiError={apiErrors[0] ?? null}
          navOpen={navOpen}
          onOpenNav={openNav}
        >
          {trackedTrain && (
            <MapContextCard trackedTrain={trackedTrain} onStopTracking={stopTracking} />
          )}
        </MapPaneOverlays>
      </section>

      <section className="bottom-pane glass" aria-label="Live trains">
        {!bottomCollapsed && (
          <DockPanel
            trains={isOnboard ? allTrains : scopedTrains}
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
