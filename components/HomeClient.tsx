"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { type LineKey, parseLineKey } from "@/lib/lineKey";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { MAP_VIEW_PADDING } from "@/lib/map/mapViewPadding";
import type { MapScope } from "@/lib/types";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapContextCard } from "./MapContextCard";
import { MapPaneOverlays } from "./MapPaneOverlays";
import { MapTopControls } from "./MapTopControls";
import { useHomeSession } from "./useHomeSession";
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

function lineMatchesScope(line: LineKey | null, scope: MapScope): boolean {
  if (!line) return true;
  const parsed = parseLineKey(line);
  if (!parsed) return true;
  if (scope === "mta") return parsed.network === "mta";
  if (scope === "njt") return parsed.network === "njt";
  return true;
}

export function HomeClient() {
  const [scope, setScope] = useState<MapScope>("all");
  const [activeLine, setActiveLine] = useState<LineKey | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [linesOpen, setLinesOpen] = useState(false);

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

  const handleScopeChange = useCallback((next: MapScope) => {
    setScope(next);
    setActiveLine((line) => (lineMatchesScope(line, next) ? line : null));
  }, []);

  const handleTrackTrain = useCallback(
    (trainId: string) => {
      toggleTrackTrain(trainId);
      setBottomCollapsed(false);
    },
    [toggleTrackTrain],
  );

  const handleStartTrip = useCallback(
    (trip: Parameters<typeof startTrip>[0]) => {
      startTrip(trip);
      setBottomCollapsed(false);
    },
    [startTrip],
  );

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const openLines = useCallback(() => setLinesOpen(true), []);
  const closeLines = useCallback(() => setLinesOpen(false), []);

  const dockSessionKey = savedTrip?.savedAt ?? "no-trip";

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
            key={dockSessionKey}
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
