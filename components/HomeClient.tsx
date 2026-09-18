"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { type Coordinator, pollingRevalidate, serializeKey, useSteddy } from "steddy";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import { type LineKey, lineKey, parseLineKey, trainMatchesLineKey } from "@/lib/lineKey";
import { trainPositionsSignature } from "@/lib/map/trainSyncKey";
import { readSavedTrip, type SavedTrip, writeSavedTrip } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import type { MapScope } from "@/lib/types";
import { ActiveTripCard } from "./ActiveTripCard";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";

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

type HomeClientProps = {
  coordinator: Coordinator;
};

export function HomeClient({ coordinator }: HomeClientProps) {
  const [scope, setScope] = useState<MapScope>("all");
  const [activeLine, setActiveLine] = useState<LineKey | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [savedTrip, setSavedTrip] = useState<SavedTrip | null>(null);
  const [tripHydrated, setTripHydrated] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [linesOpen, setLinesOpen] = useState(false);

  const {
    data: njData,
    error: njError,
    isLoading: njLoading,
    isValidating: njValidating,
  } = useSteddy(NJ_KEY, fetchNjTrains, { staleTime: NJ_POLL_MS });

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
  } = useSteddy(SUBWAY_KEY, fetchSubwayTrains, { staleTime: SUBWAY_POLL_MS });

  useEffect(() => {
    setSavedTrip(readSavedTrip());
    setTripHydrated(true);
  }, []);

  useEffect(() => {
    if (!tripHydrated) return;
    writeSavedTrip(savedTrip);
  }, [savedTrip, tripHydrated]);

  useEffect(() => {
    if (!activeLine) return;
    const parsed = parseLineKey(activeLine);
    if (!parsed) return;
    if (scope === "mta" && parsed.network !== "mta") setActiveLine(null);
    if (scope === "njt" && parsed.network !== "njt") setActiveLine(null);
  }, [scope, activeLine]);

  const refresh = () => {
    void coordinator.revalidate(serializeKey(NJ_KEY), fetchNjTrains, { force: true });
    void coordinator.revalidate(serializeKey(SUBWAY_KEY), fetchSubwayTrains, { force: true });
  };

  useEffect(() => {
    const njSerialized = serializeKey(NJ_KEY);
    const subwaySerialized = serializeKey(SUBWAY_KEY);
    const stopNj = pollingRevalidate(coordinator, njSerialized, NJ_POLL_MS);
    const stopSubway = pollingRevalidate(coordinator, subwaySerialized, SUBWAY_POLL_MS);
    return () => {
      stopNj();
      stopSubway();
    };
  }, [coordinator]);

  const allTrains = useMemo(() => {
    const nj = njData?.trains ?? [];
    const subway = subwayData?.trains ?? [];
    return [...subway, ...nj];
  }, [njData?.trains, subwayData?.trains]);

  const scopedTrains = useMemo(() => {
    if (scope === "mta") return allTrains.filter((t) => t.network === "mta");
    if (scope === "njt") return allTrains.filter((t) => t.network === "njt");
    return allTrains;
  }, [allTrains, scope]);

  const visibleTrains = useMemo(
    () => scopedTrains.filter((t) => trainMatchesLineKey(t, activeLine)),
    [scopedTrains, activeLine],
  );

  const mapTrainsSignature = useMemo(() => trainPositionsSignature(visibleTrains), [visibleTrains]);

  const tripHighlightTrainIds = useMemo(() => {
    if (!savedTrip) return new Set<string>();
    const ids = scopedTrains.filter((t) => trainMatchesTrip(t, savedTrip)).map((t) => t.id);
    return new Set(ids);
  }, [scopedTrains, savedTrip]);

  const tripHighlightKey = useMemo(
    () => [...tripHighlightTrainIds].sort().join("\n"),
    [tripHighlightTrainIds],
  );

  const plannedRouteCoords = savedTrip?.route.coordinatesLonLat ?? null;
  const plannedRouteFitKey = savedTrip
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

  const apiErrors = [
    njData?.error,
    subwayData?.error,
    njError instanceof Error ? njError.message : njError ? String(njError) : null,
    subwayError instanceof Error ? subwayError.message : subwayError ? String(subwayError) : null,
  ].filter(Boolean) as string[];

  const njConfigured = njData?.configured ?? true;
  const loading = njLoading || subwayLoading;
  const validating = njValidating || subwayValidating;
  const updatedAt = pickLatestUpdatedAt(njData?.updatedAt, subwayData?.updatedAt);

  const mapPadding = useMemo(
    () => ({
      top: 56,
      bottom: 24,
      left: 16,
      right: 16,
    }),
    [],
  );

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
          className={`map-top-controls-btn glass ${!bottomCollapsed ? "map-top-controls-btn--on" : ""}`}
          aria-expanded={!bottomCollapsed}
          aria-label={bottomCollapsed ? "Show trains panel" : "Collapse trains panel"}
          onClick={() => setBottomCollapsed((c) => !c)}
        >
          Trains
          <span className="map-top-controls-chevron" aria-hidden>
            {bottomCollapsed ? "▲" : "▼"}
          </span>
        </button>
        <span className="map-top-controls-meta glass">
          {validating && <span className="bottom-pane-live-dot" title="Updating" />}
          <span className="map-top-controls-count">{scopedTrains.length} live</span>
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
        />

        {savedTrip && (
          <ActiveTripCard
            trip={savedTrip}
            onEdit={() => setNavOpen(true)}
            onEnd={() => setSavedTrip(null)}
          />
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
            trains={scopedTrains}
            loading={loading}
            validating={validating}
            updatedAt={updatedAt}
            activeLine={activeLine}
            onRefresh={refresh}
            savedTrip={savedTrip}
            tripHighlightTrainIds={tripHighlightTrainIds}
          />
        )}
      </section>

      <LinesFilterDrawer
        open={linesOpen}
        onClose={() => setLinesOpen(false)}
        scope={scope}
        onScopeChange={setScope}
        activeLine={activeLine}
        onSelectLine={setActiveLine}
        counts={lineCounts}
      />

      <NavigationSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        initialTrip={savedTrip}
        onStartTrip={(trip) => {
          setSavedTrip(trip);
          setBottomCollapsed(false);
        }}
        onEndTrip={() => setSavedTrip(null)}
      />
    </div>
  );
}

function pickLatestUpdatedAt(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
