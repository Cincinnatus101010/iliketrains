"use client";

import { NJ_LINES } from "@/lib/nj/lines";

type LineLegendProps = {
  activeLine: string | null;
  onSelectLine: (lineId: string | null) => void;
  counts: Record<string, number>;
};

export function LineLegend({ activeLine, onSelectLine, counts }: LineLegendProps) {
  return (
    <div className="line-legend" role="group" aria-label="NJ Rail lines">
      <button
        type="button"
        className={`line-pill line-pill--all ${activeLine === null ? "line-pill--on" : ""}`}
        onClick={() => onSelectLine(null)}
      >
        All lines
      </button>
      {NJ_LINES.map((line) => {
        const count = counts[line.id] ?? 0;
        const on = activeLine === line.id;
        return (
          <button
            key={line.id}
            type="button"
            className={`line-pill ${on ? "line-pill--on" : ""}`}
            onClick={() => onSelectLine(line.id)}
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
  );
}
