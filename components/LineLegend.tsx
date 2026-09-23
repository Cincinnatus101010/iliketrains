"use client";

import { type LineKey, lineKey } from "@/lib/lineKey";
import { SUBWAY_LINES } from "@/lib/mta/lines";
import { NJ_LINES } from "@/lib/nj/lines";
import type { MapScope } from "@/types";

type LineLegendProps = {
  scope: MapScope;
  activeLine: LineKey | null;
  onSelectLine: (lineId: LineKey | null) => void;
  counts: Record<string, number>;
};

function countFor(counts: Record<string, number>, network: "mta" | "njt", route: string): number {
  return counts[lineKey(network, route)] ?? 0;
}

function isLightSubwayRoute(route: string): boolean {
  const r = route.toUpperCase();
  return r === "N" || r === "Q" || r === "R" || r === "W" || r === "L";
}

export function LineLegend({ scope, activeLine, onSelectLine, counts }: LineLegendProps) {
  const showSubway = scope === "all" || scope === "mta";
  const showNj = scope === "all" || scope === "njt";

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
                    <span
                      className="line-drawer-row-rail"
                      style={{ background: line.color }}
                      aria-hidden
                    />
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
