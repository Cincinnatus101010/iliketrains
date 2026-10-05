"use client";

import { type LineKey, parseLineKey } from "@/lib/lineKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";

type MapTopControlsProps = {
  linesOpen: boolean;
  onOpenLines: () => void;
  activeLine: LineKey | null;
  bottomCollapsed: boolean;
  onToggleBottom: () => void;
  savedTrip: SavedTrip | null;
  validating: boolean;
  countLabel: string;
};

export function MapTopControls({
  linesOpen,
  onOpenLines,
  activeLine,
  bottomCollapsed,
  onToggleBottom,
  savedTrip,
  validating,
  countLabel,
}: MapTopControlsProps) {
  return (
    <div className="map-top-controls">
      <button
        type="button"
        className="map-top-controls-btn glass"
        aria-expanded={linesOpen}
        onClick={onOpenLines}
      >
        Lines
        {activeLine && (
          <span className="map-top-controls-active">{parseLineKey(activeLine)?.route ?? "1"}</span>
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
        onClick={onToggleBottom}
      >
        {savedTrip ? "Trip" : "Trains"}
        <span className="map-top-controls-chevron" aria-hidden>
          {bottomCollapsed ? "▲" : "▼"}
        </span>
      </button>
      <span className="map-top-controls-meta glass">
        {validating && <span className="bottom-pane-live-dot" title="Updating" />}
        <span className="map-top-controls-count">{countLabel}</span>
      </span>
    </div>
  );
}
