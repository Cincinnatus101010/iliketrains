"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { type LineKey, lineKey, parseLineKey, trainMatchesLineKey } from "@/lib/lineKey";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { trainLiveSignature, trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import type { MapScope } from "@/lib/types";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapContextCard } from "./MapContextCard";
import { useHomeSession } from "./useHomeSession";
import { useLiveTrainFeeds } from "./useLiveTrainFeeds";
import { useMissedPollGrace } from "./useMissedPollGrace";

const NavigationSheet = dynamic(() => import("./NavigationSheet").then((m) => m.NavigationSheet), {
  ssr: false,
});

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

const MAP_PADDING = { top: 56, bottom: 24, left: 16, right: 16 } as const;

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

  const handleScopeChange = useCallback((next: MapScope) => {
    setScope(next);
    setActiveLine((line) => (lineMatchesScope(line, next) ? line : null));
  }, []);

  const scopedTrains = useMemo(() => {
    if (scope === "mta") return allTrains.filter((t) => t.network === "mta");
    if (scope === "njt") return allTrains.filter((t) => t.network === "njt");
    return allTrains;
  }, [allTrains, scope]);

  const visibleTrains = useMemo(() => {
    if (isOnboard) {
      return allTrains.filter((t) => trainMatchesLineKey(t, activeLine));
    }
    let filtered = scopedTrains.filter((t) => trainMatchesLineKey(t, activeLine));
    if (savedTrip) {
      filtered = filtered.filter((t) => trainMatchesTrip(t, savedTrip));
    }
    return filtered;
  }, [isOnboard, allTrains, scopedTrains, activeLine, savedTrip]);

  const mapLiveCount = isOnboard
    ? visibleTrains.length
    : savedTrip
      ? visibleTrains.length
      : scopedTrains.length;

  const trackedTrain = useMemo(
    () => (trackingTrainId ? (allTrains.find((t) => t.id === trackingTrainId) ?? null) : null),
    [allTrains, trackingTrainId],
  );

  useMissedPollGrace(Boolean(trackingTrainId), Boolean(trackedTrain), {
    maxMisses: TRAIN_MISSED_FEED_POLLS,
    onExpire: stopTracking,
  });

  const handleTrackTrain = useCallback(
    (trainId: string) => {
      toggleTrackTrain(trainId);
      setBottomCollapsed(false);
    },
    [toggleTrackTrain],
  );

  const mapTrainsSignature = useMemo(() => trainPositionsSignature(visibleTrains), [visibleTrains]);

  const tripHighlightTrainIds = useMemo(() => {
    if (!savedTrip) return new Set<string>();
    if (trackingTrainId) return new Set([trackingTrainId]);
    const ids = scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).map((t) => t.id);
    return new Set(ids);
  }, [scopedTrains, savedTrip, trackingTrainId]);

  const tripHighlightKey = useMemo(
    () => [...tripHighlightTrainIds].sort().join("\n"),
    [tripHighlightTrainIds],
  );

  const showPlannedRoute = Boolean(savedTrip) && !trackingTrainId;
  const plannedRouteCoords = showPlannedRoute ? (savedTrip?.route.coordinatesLonLat ?? null) : null;
  const plannedRouteFitKey =
    showPlannedRoute && savedTrip
      ? `${savedTrip.fromKey}:${savedTrip.toKey}:${savedTrip.savedAt}`
      : null;

  const lineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of scopedTrains) {
      const key = lineKey(t.network, t.route);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [scopedTrains]);

  const trackedTrainLiveKey = trackedTrain ? trainLiveSignature(trackedTrain) : null;

  const dockSessionKey = savedTrip?.savedAt ?? "no-trip";

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

  return (
    <div
      className={`app-frame troisi-root ${bottomCollapsed ? "app-frame--bottom-collapsed" : ""}`}
    >
      <div className="map-top-controls">
        <button
          type="button"
          className="map-top-controls-btn glass"
          aria-expanded={linesOpen}
          onClick={openLines}
        >
          Lines
          {activeLine && (
            <span className="map-top-controls-active">
              {parseLineKey(activeLine)?.route ?? "1"}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`map-top-controls-btn glass ${!bottomCollapsed ? "map-top-controls-btn--on" : ""} ${savedTrip ? "map-top-controls-btn--trip" : ""}`}
          aria-expanded={!bottomCollapsed}
          aria-label={
            bottomCollapsed
              ? savedTrip
                ? "Show trip and trains panel"
                : "Show trains panel"
              : "Collapse trains panel"
          }
          onClick={() => setBottomCollapsed((c) => !c)}
        >
          {savedTrip ? "Trip" : "Trains"}
          <span className="map-top-controls-chevron" aria-hidden>
            {bottomCollapsed ? "▲" : "▼"}
          </span>
        </button>
        <span className="map-top-controls-meta glass">
          {validating && <span className="bottom-pane-live-dot" title="Updating" />}
          <span className="map-top-controls-count">
            {isOnboard
              ? "On train"
              : savedTrip
                ? `${mapLiveCount} on route`
                : `${mapLiveCount} live`}
          </span>
        </span>
      </div>

      <section className="map-pane" aria-label="Map">
        <NjLiveMap
          trains={visibleTrains}
          trainsSignature={mapTrainsSignature}
          highlightLine={activeLine}
          padding={MAP_PADDING}
          plannedRoute={plannedRouteCoords}
          plannedRouteFitKey={plannedRouteFitKey}
          tripHighlightTrainIds={tripHighlightTrainIds}
          tripHighlightKey={tripHighlightKey}
          trackingTrainId={trackingTrainId}
          trackingTrainLiveKey={trackedTrainLiveKey}
          onTrackTrain={handleTrackTrain}
          onStopTracking={stopTracking}
        />

        {trackedTrain && (
          <MapContextCard trackedTrain={trackedTrain} onStopTracking={stopTracking} />
        )}

        {!njConfigured && (
          <div className="map-pane-alert glass" role="status">
            Set <code>NJTRANSIT_USERNAME</code> / <code>NJTRANSIT_PASSWORD</code> in{" "}
            <code>.env.local</code>
          </div>
        )}
        {apiErrors.length > 0 && (
          <div className="map-pane-alert glass map-pane-alert--error" role="alert">
            {apiErrors[0]}
          </div>
        )}

        <button
          type="button"
          className="nav-fab"
          aria-label="Plan a trip"
          aria-expanded={navOpen}
          onClick={openNav}
        >
          <span className="nav-fab-icon" aria-hidden>
            +
          </span>
        </button>
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
