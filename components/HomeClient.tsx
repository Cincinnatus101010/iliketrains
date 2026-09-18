"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { pollingRevalidate, serializeKey, useSteddy, type Coordinator } from "steddy";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { LineLegend } from "./LineLegend";
import { TrainPanel } from "./TrainPanel";

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

const TRAINS_KEY = ["nj-trains"] as const;
const POLL_MS = 20_000;
const MOBILE_MQ = "(max-width: 768px)";

type HomeClientProps = {
  coordinator: Coordinator;
};

export function HomeClient({ coordinator }: HomeClientProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );
  const [sheetOpen, setSheetOpen] = useState(
    () => typeof window === "undefined" || !window.matchMedia(MOBILE_MQ).matches,
  );
  const [activeLine, setActiveLine] = useState<string | null>(null);

  const { data, error, isLoading, isValidating } = useSteddy(TRAINS_KEY, fetchNjTrains, {
    staleTime: POLL_MS,
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setSheetOpen(!mobile);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const refresh = () => {
    void coordinator.revalidate(serializeKey(TRAINS_KEY), fetchNjTrains, { force: true });
  };

  useEffect(() => {
    const serialized = serializeKey(TRAINS_KEY);
    return pollingRevalidate(coordinator, serialized, POLL_MS);
  }, [coordinator]);

  const trains = data?.trains ?? [];
  const apiError = data?.error ?? (error instanceof Error ? error.message : error ? String(error) : null);
  const configured = data?.configured ?? true;

  const lineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trains) {
      counts[t.route] = (counts[t.route] ?? 0) + 1;
    }
    return counts;
  }, [trains]);

  const visibleTrains = activeLine ? trains.filter((t) => t.route === activeLine) : trains;
  const mapPadding = useMemo(() => {
    if (isMobile) {
      return sheetOpen
        ? { top: 72, bottom: Math.min(window.innerHeight * 0.52, 420), left: 12, right: 12 }
        : { top: 72, bottom: 88, left: 12, right: 12 };
    }
    return { top: 24, bottom: 24, left: 340, right: 24 };
  }, [isMobile, sheetOpen]);

  return (
    <div className={`app-frame troisi-root ${sheetOpen ? "app-frame--sheet-open" : ""}`}>
      <NjLiveMap trains={visibleTrains} highlightLine={activeLine} padding={mapPadding} />

      <div className="overlay overlay--legend glass">
        <p className="overlay-kicker">NJ Rail · map key</p>
        <LineLegend
          activeLine={activeLine}
          onSelectLine={setActiveLine}
          counts={lineCounts}
        />
      </div>

      {!configured && (
        <div className="overlay overlay--alert glass" role="status">
          Set <code>NJTRANSIT_USERNAME</code> / <code>NJTRANSIT_PASSWORD</code> in <code>.env.local</code>
        </div>
      )}
      {apiError && (
        <div className="overlay overlay--alert glass overlay--error" role="alert">
          {apiError}
        </div>
      )}

      <aside className={`dock glass ${sheetOpen ? "dock--open" : ""}`} aria-hidden={isMobile && !sheetOpen}>
        <TrainPanel
          trains={trains}
          loading={isLoading}
          validating={isValidating}
          updatedAt={data?.updatedAt}
          activeLine={activeLine}
          onRefresh={refresh}
        />
        {isMobile && (
          <button type="button" className="sheet-grab" aria-label="Close panel" onClick={() => setSheetOpen(false)} />
        )}
      </aside>

      {isMobile && !sheetOpen && (
        <button type="button" className="fab" onClick={() => setSheetOpen(true)}>
          <span className="fab-label">Trains</span>
          <span className="fab-count">{trains.length}</span>
        </button>
      )}
    </div>
  );
}
