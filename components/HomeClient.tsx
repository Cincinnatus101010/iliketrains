"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Coordinator, serializeKey, useSteddy } from "steddy";
import { fetchFollowedTrain } from "@/lib/fetchFollowedTrain";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import { type LineKey, lineKey, parseLineKey, trainMatchesLineKey } from "@/lib/lineKey";
import { trainLiveSignature, trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import type { MapScope } from "@/lib/types";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapContextCard } from "./MapContextCard";
import { useHomeSession } from "./useHomeSession";

const NavigationSheet = dynamic(() => import("./NavigationSheet").then((m) => m.NavigationSheet), {
  ssr: false,
});

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

const NJ_KEY = ["nj-trains"] as const;
const SUBWAY_KEY = ["subway-trains"] as const;
const NJ_POLL_MS = 20_000;
const SUBWAY_POLL_MS = 5_000;
const FOLLOW_POLL_MS = 5_000;

type HomeClientProps = {
  coordinator: Coordinator;
};

function lineMatchesScope(line: LineKey | null, scope: MapScope): boolean {
  if (!line) return true;
  const parsed = parseLineKey(line);
  if (!parsed) return true;
  if (scope === "mta") return parsed.network === "mta";
  if (scope === "njt") return parsed.network === "njt";
  return true;
}

export function HomeClient({ coordinator }: HomeClientProps) {
  const [scope, setScope] = useState<MapScope>("all");
  const [activeLine, setActiveLine] = useState<LineKey | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [linesOpen, setLinesOpen] = useState(false);

  const {
    savedTrip,
    trackingTrainId: followedTrainId,
    isOnboard,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  } = useHomeSession();

  const followMissedPolls = useRef(0);
  const followKey = followedTrainId ? (["followed-train", followedTrainId] as const) : null;

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

  const handleScopeChange = (next: MapScope) => {
    setScope(next);
    setActiveLine((line) => (lineMatchesScope(line, next) ? line : null));
  };

  const refresh = () => {
    if (followedTrainId) {
      void coordinator.revalidate(
        serializeKey(["followed-train", followedTrainId]),
        fetchFollowedTrain,
        {
          force: true,
        },
      );
      return;
    }
    void coordinator.revalidate(serializeKey(NJ_KEY), fetchNjTrains, { force: true });
    void coordinator.revalidate(serializeKey(SUBWAY_KEY), fetchSubwayTrains, { force: true });
  };

  const allTrains = useMemo(() => {
    if (isOnboard) return followData?.trains ?? [];
    const nj = njData?.trains ?? [];
    const subway = subwayData?.trains ?? [];
    return [...subway, ...nj];
  }, [isOnboard, followData?.trains, njData?.trains, subwayData?.trains]);

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

  const followedTrain = useMemo(
    () => (followedTrainId ? (allTrains.find((t) => t.id === followedTrainId) ?? null) : null),
    [allTrains, followedTrainId],
  );

  useEffect(() => {
    if (!followedTrainId) {
      followMissedPolls.current = 0;
      return;
    }
    if (followedTrain) {
      followMissedPolls.current = 0;
      return;
    }
    followMissedPolls.current += 1;
    if (followMissedPolls.current >= 3) {
      followMissedPolls.current = 0;
      stopTracking();
    }
  }, [followedTrainId, followedTrain, stopTracking]);

  const handleFollowTrain = (trainId: string) => {
    toggleTrackTrain(trainId);
    setBottomCollapsed(false);
  };

  const mapTrainsSignature = useMemo(() => trainPositionsSignature(visibleTrains), [visibleTrains]);

  const tripHighlightTrainIds = useMemo(() => {
    if (!savedTrip) return new Set<string>();
    if (followedTrainId) return new Set([followedTrainId]);
    const ids = scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).map((t) => t.id);
    return new Set(ids);
  }, [scopedTrains, savedTrip, followedTrainId]);

  const tripHighlightKey = useMemo(
    () => [...tripHighlightTrainIds].sort().join("\n"),
    [tripHighlightTrainIds],
  );

  const showPlannedRoute = Boolean(savedTrip) && !followedTrainId;
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

  const apiErrors = isOnboard
    ? ([
        followData?.error,
        followError instanceof Error
          ? followError.message
          : followError
            ? String(followError)
            : null,
      ].filter(Boolean) as string[])
    : ([
        njData?.error,
        subwayData?.error,
        njError instanceof Error ? njError.message : njError ? String(njError) : null,
        subwayError instanceof Error
          ? subwayError.message
          : subwayError
            ? String(subwayError)
            : null,
      ].filter(Boolean) as string[]);

  const njConfigured = isOnboard ? (followData?.configured ?? true) : (njData?.configured ?? true);
  const loading = isOnboard ? followLoading : njLoading || subwayLoading;
  const validating = isOnboard ? followValidating : njValidating || subwayValidating;
  const updatedAt = isOnboard
    ? followData?.updatedAt
    : pickLatestUpdatedAt(njData?.updatedAt, subwayData?.updatedAt);

  const followedTrainLiveKey = followedTrain ? trainLiveSignature(followedTrain) : null;

  const mapPadding = useMemo(
    () => ({
      top: 56,
      bottom: 24,
      left: 16,
      right: 16,
    }),
    [],
  );

  const dockSessionKey = savedTrip?.savedAt ?? "no-trip";

  const handleStartTrip = (trip: Parameters<typeof startTrip>[0]) => {
    startTrip(trip);
    setBottomCollapsed(false);
  };

  return (
    <div
      className={`app-frame troisi-root ${bottomCollapsed ? "app-frame--bottom-collapsed" : ""}`}
    >
      <div className="map-top-controls">
        <button
          type="button"
          className="map-top-controls-btn glass"
          aria-expanded={linesOpen}
          onClick={() => setLinesOpen(true)}
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
          padding={mapPadding}
          plannedRoute={plannedRouteCoords}
          plannedRouteFitKey={plannedRouteFitKey}
          tripHighlightTrainIds={tripHighlightTrainIds}
          tripHighlightKey={tripHighlightKey}
          followedTrainId={followedTrainId}
          followedTrainLiveKey={followedTrainLiveKey}
          onFollowTrain={handleFollowTrain}
          onClearFollow={stopTracking}
        />

        {followedTrain && (
          <MapContextCard followedTrain={followedTrain} onStopFollow={stopTracking} />
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
          onClick={() => setNavOpen(true)}
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
            followedTrainId={followedTrainId}
            onFollowTrain={handleFollowTrain}
            onEditTrip={() => setNavOpen(true)}
            onEndTrip={endTrip}
          />
        )}
      </section>

      <LinesFilterDrawer
        open={linesOpen}
        onClose={() => setLinesOpen(false)}
        scope={scope}
        onScopeChange={handleScopeChange}
        activeLine={activeLine}
        onSelectLine={setActiveLine}
        counts={lineCounts}
      />

      <NavigationSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        initialTrip={savedTrip}
        onStartTrip={handleStartTrip}
        onEndTrip={endTrip}
      />
    </div>
  );
}

function pickLatestUpdatedAt(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
