"use client";

import { NJ_LINES } from "@/lib/nj/lines";
import { SUBWAY_LINES } from "@/lib/mta/lines";
import { lineKey, type LineKey } from "@/lib/lineKey";
import type { MapScope } from "@/lib/types";

type LineLegendProps = {
  scope: MapScope;
  activeLine: LineKey | null;
  onSelectLine: (lineId: LineKey | null) => void;
  counts: Record<string, number>;
  variant?: "horizontal" | "drawer";
};

function countFor(counts: Record<string, number>, network: "mta" | "njt", route: string): number {
  return counts[lineKey(network, route)] ?? 0;
}

function isLightSubwayRoute(route: string): boolean {
  const r = route.toUpperCase();
  return r === "N" || r === "Q" || r === "R" || r === "W" || r === "L";
}

export function LineLegend({
  scope,
  activeLine,
  onSelectLine,
  counts,
  variant = "horizontal",
}: LineLegendProps) {
  const isDrawer = variant === "drawer";
  const showSubway = scope === "all" || scope === "mta";
  const showNj = scope === "all" || scope === "njt";

  if (isDrawer) {
    return (
      <div className="line-legend line-legend--drawer" role="group" aria-label="Transit lines">
        <button
          type="button"
          className={`line-drawer-all ${activeLine === null ? "line-drawer-all--on" : ""}`}
          onClick={() => onSelectLine(null)}
        >
          Show all lines on map
        </button>

        {showSubway && (
          <section className="line-drawer-group">
            <h3 className="line-drawer-group-title">NYC Subway</h3>
            <div className="line-drawer-grid">
              {SUBWAY_LINES.map((line) => {
                const key = lineKey("mta", line.id);
                const count = countFor(counts, "mta", line.id);
                const on = activeLine === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`line-drawer-tile ${on ? "line-drawer-tile--on" : ""}`}
                    onClick={() => onSelectLine(key)}
                    title={line.name}
                    aria-pressed={on}
                  >
                    <span
                      className="line-drawer-badge"
                      style={{
                        background: line.color,
                        color: isLightSubwayRoute(line.id) ? "#111" : "#fff",
                      }}
                    >
                      {line.id}
                    </span>
                    {count > 0 && <span className="line-drawer-live">{count}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {showNj && (
          <section className="line-drawer-group">
            <h3 className="line-drawer-group-title">NJ Rail</h3>
            <ul className="line-drawer-list">
              {NJ_LINES.map((line) => {
                const key = lineKey("njt", line.id);
                const count = countFor(counts, "njt", line.id);
                const on = activeLine === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`line-drawer-row ${on ? "line-drawer-row--on" : ""}`}
                      onClick={() => onSelectLine(key)}
                      aria-pressed={on}
                    >
                      <span className="line-drawer-row-rail" style={{ background: line.color }} aria-hidden />
                      <span className="line-drawer-row-code">{line.id}</span>
                      <span className="line-drawer-row-name">{line.name}</span>
                      <span className="line-drawer-row-count">{count > 0 ? count : "—"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="line-legend" role="group" aria-label="Transit lines">
      <button
        type="button"
        className={`line-pill line-pill--all ${activeLine === null ? "line-pill--on" : ""}`}
        onClick={() => onSelectLine(null)}
      >
        All lines
      </button>

      {showSubway && (
        <div className="line-legend-section">
          {scope === "all" && <p className="line-legend-heading">NYC Subway</p>}
          {SUBWAY_LINES.map((line) => {
            const key = lineKey("mta", line.id);
            const count = countFor(counts, "mta", line.id);
            const on = activeLine === key;
            return (
              <button
                key={key}
                type="button"
                className={`line-pill ${on ? "line-pill--on" : ""}`}
                onClick={() => onSelectLine(key)}
                title={line.name}
                aria-pressed={on}
              >
                <span className="line-pill-swatch" style={{ background: line.color }} aria-hidden />
                <span className="line-pill-code">{line.id}</span>
                <span className="line-pill-name">{line.name}</span>
                {count > 0 && <span className="line-pill-count">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {showNj && (
        <div className="line-legend-section">
          {scope === "all" && <p className="line-legend-heading">NJ Rail</p>}
          {NJ_LINES.map((line) => {
            const key = lineKey("njt", line.id);
            const count = countFor(counts, "njt", line.id);
            const on = activeLine === key;
            return (
              <button
                key={key}
                type="button"
                className={`line-pill ${on ? "line-pill--on" : ""}`}
                onClick={() => onSelectLine(key)}
                title={line.name}
                aria-pressed={on}
              >
                <span className="line-pill-swatch" style={{ background: line.color }} aria-hidden />
                <span className="line-pill-code">{line.id}</span>
                <span className="line-pill-name">{line.name}</span>
                {count > 0 && <span className="line-pill-count">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
