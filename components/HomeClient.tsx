"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { pollingRevalidate, serializeKey, useSteddy, type Coordinator } from "steddy";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { fetchSubwayTrains } from "@/lib/fetchSubwayTrains";
import { lineKey, parseLineKey, trainMatchesLineKey, type LineKey } from "@/lib/lineKey";
import type { MapScope } from "@/lib/types";
import type { PlannedRoute } from "@/lib/trip/types";
import { DockPanel } from "./DockPanel";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { NavigationSheet } from "./NavigationSheet";

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
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [linesOpen, setLinesOpen] = useState(false);

  const { data: njData, error: njError, isLoading: njLoading, isValidating: njValidating } = useSteddy(
    NJ_KEY,
    fetchNjTrains,
    { staleTime: NJ_POLL_MS },
  );

  const {
    data: subwayData,
    error: subwayError,
    isLoading: subwayLoading,
    isValidating: subwayValidating,
  } = useSteddy(SUBWAY_KEY, fetchSubwayTrains, { staleTime: SUBWAY_POLL_MS });

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
      <section className="map-pane" aria-label="Map">
        <NjLiveMap
          trains={visibleTrains}
          highlightLine={activeLine}
          padding={mapPadding}
          plannedRoute={plannedRoute?.coordinatesLonLat ?? null}
        />

        <div className="map-pane-chrome">
          <button
            type="button"
            className="lines-filter-trigger glass"
            aria-expanded={linesOpen}
            onClick={() => setLinesOpen(true)}
          >
            <span className="lines-filter-trigger-label">Lines</span>
            {activeLine && (
              <span className="lines-filter-trigger-active">{parseLineKey(activeLine)?.route ?? "1"}</span>
            )}
          </button>
        </div>

        {!njConfigured && (
          <div className="map-pane-alert glass" role="status">
            Set <code>NJTRANSIT_USERNAME</code> / <code>NJTRANSIT_PASSWORD</code> in <code>.env.local</code>
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

      <section
        className="bottom-pane glass"
        aria-label="Live trains"
        aria-expanded={!bottomCollapsed}
      >
        <div className="bottom-pane-toolbar">
          <div className="bottom-pane-toolbar-actions">
            <button
              type="button"
              className="bottom-pane-toolbar-btn bottom-pane-toolbar-btn--lines"
              aria-expanded={linesOpen}
              onClick={() => setLinesOpen(true)}
            >
              Lines
            </button>
            <button
              type="button"
              className="bottom-pane-toolbar-btn bottom-pane-toolbar-btn--panel"
              aria-expanded={!bottomCollapsed}
              aria-label={bottomCollapsed ? "Show trains panel" : "Collapse trains panel"}
              onClick={() => setBottomCollapsed((c) => !c)}
            >
              Trains
              <span className="bottom-pane-toolbar-btn-chevron" aria-hidden>
                {bottomCollapsed ? "▲" : "▼"}
              </span>
            </button>
          </div>
          <span className="bottom-pane-toolbar-meta">
            {validating && <span className="bottom-pane-live-dot" aria-label="Updating" />}
            <span className="bottom-pane-toolbar-count">{scopedTrains.length} live</span>
          </span>
        </div>

        {!bottomCollapsed && (
          <DockPanel
            trains={scopedTrains}
            loading={loading}
            validating={validating}
            updatedAt={updatedAt}
            activeLine={activeLine}
            onRefresh={refresh}
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
        onRoute={(route) => setPlannedRoute(route)}
        onClearRoute={() => setPlannedRoute(null)}
      />
    </div>
  );
}

function pickLatestUpdatedAt(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
