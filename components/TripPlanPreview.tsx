"use client";

import { tripStatsHeadline } from "@/lib/trip/tripStats";
import type { PlannedRoute } from "@/lib/trip/types";
import { TripTimeline } from "./TripTimeline";

type TripPlanPreviewProps = {
  fromName: string;
  toName: string;
  route: PlannedRoute;
};

export function TripPlanPreview({ fromName, toName, route }: TripPlanPreviewProps) {
  const stats = route.stats;

  return (
    <div className="trip-plan-preview">
      <div className="trip-plan-preview-hero">
        <p className="trip-plan-preview-route">
          <span>{fromName}</span>
          <span className="trip-plan-preview-arrow" aria-hidden>
            →
          </span>
          <span>{toName}</span>
        </p>
        {stats && <p className="trip-plan-preview-stats">{tripStatsHeadline(stats)}</p>}
      </div>

      {stats && stats.lines.length > 0 && (
        <ul className="trip-plan-lines" aria-label="Lines on this trip">
          {stats.lines.map((line) => (
            <li key={`${line.network}:${line.route}`}>
              <span
                className="trip-plan-line-chip"
                style={{
                  borderColor: route.steps.find((s) => s.route === line.route)?.color ?? "#666",
                }}
              >
                <span className="trip-plan-line-code">{line.route}</span>
                {line.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="nav-sheet-preview-title">Step-by-step</p>
      <TripTimeline steps={route.steps} />
      <p className="trip-plan-footnote">
        Walk times are estimates. Live train positions and NJ departures update in the map panel
        after you start.
      </p>
    </div>
  );
}
