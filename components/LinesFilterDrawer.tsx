"use client";

import { LineLegend } from "./LineLegend";
import type { LineKey } from "@/lib/lineKey";
import type { MapScope } from "@/lib/types";

type LinesFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  scope: MapScope;
  onScopeChange: (scope: MapScope) => void;
  activeLine: LineKey | null;
  onSelectLine: (lineId: LineKey | null) => void;
  counts: Record<string, number>;
};

export function LinesFilterDrawer({
  open,
  onClose,
  scope,
  onScopeChange,
  activeLine,
  onSelectLine,
  counts,
}: LinesFilterDrawerProps) {
  if (!open) return null;

  return (
    <div className="lines-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="lines-drawer glass"
        role="dialog"
        aria-label="Filter lines"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lines-drawer-head">
          <div>
            <p className="panel-kicker">Map filter</p>
            <h2 className="panel-title">Lines</h2>
          </div>
          <button type="button" className="nav-sheet-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="lines-drawer-scope" role="group" aria-label="Map scope">
          {(["all", "mta", "njt"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`lines-drawer-scope-btn ${scope === id ? "lines-drawer-scope-btn--on" : ""}`}
              onClick={() => onScopeChange(id)}
              aria-pressed={scope === id}
            >
              {id === "all" ? "All" : id === "mta" ? "Subway" : "NJ Rail"}
            </button>
          ))}
        </div>

        <LineLegend
          variant="drawer"
          scope={scope}
          activeLine={activeLine}
          onSelectLine={onSelectLine}
          counts={counts}
        />
      </aside>
    </div>
  );
}
