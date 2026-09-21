"use client";

import { parseLineKey } from "@/lib/lineKey";
import { tripStatsHeadline } from "@/lib/trip/tripStats";
import type { PlannedRoute } from "@/lib/trip/types";
import type { ScheduleDeparture } from "@/lib/types";
import { TripDeparturePicker } from "./TripDeparturePicker";
import { TripTimeline } from "./TripTimeline";

type TripPlanPreviewProps = {
  fromKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute;
  chosenDeparture: ScheduleDeparture | null;
  onChooseDeparture: (item: ScheduleDeparture) => void;
  onDeparturesLoaded?: (hasChoices: boolean) => void;
};

export function TripPlanPreview({
  fromKey,
  fromName,
  toName,
  route,
  chosenDeparture,
  onChooseDeparture,
  onDeparturesLoaded,
}: TripPlanPreviewProps) {
  const stats = route.stats;
  const isNjOrigin = parseLineKey(fromKey)?.network === "njt";

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

      {isNjOrigin ? (
        <TripDeparturePicker
          fromKey={fromKey}
          fromName={fromName}
          route={route}
          selected={chosenDeparture}
          onSelect={onChooseDeparture}
          onDeparturesLoaded={onDeparturesLoaded}
        />
      ) : (
        <p className="trip-departure-hint">
          Subway-only trip — use live trains on the map after you start.
        </p>
      )}

      <details className="trip-plan-steps">
        <summary className="trip-plan-steps-summary">Step-by-step directions</summary>
        <TripTimeline steps={route.steps} />
      </details>
      <p className="trip-plan-footnote">
        Walk times are estimates. Live train positions update in the map panel after you start.
      </p>
    </div>
  );
}
