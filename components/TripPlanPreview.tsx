"use client";

import { parseLineKey } from "@/lib/lineKey";
import { routeStepsForDisplay } from "@/lib/trip/routeDisplaySteps";
import { tripConnectionLabel, tripStatsHeadline } from "@/lib/trip/tripStats";
import type { PlannedRoute, ScheduleDeparture, TripBoardingSchedule } from "@/types";
import { TripDeparturePicker } from "./TripDeparturePicker";
import { TripTimeline } from "./TripTimeline";

type TripPlanPreviewProps = {
  fromKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute;
  boarding: TripBoardingSchedule | null;
  scheduleLoading?: boolean;
  chosenDeparture: ScheduleDeparture | null;
  onChooseDeparture: (item: ScheduleDeparture) => void;
  onDeparturesLoaded?: (hasChoices: boolean) => void;
};

export function TripPlanPreview({
  fromKey,
  fromName,
  toName,
  route,
  boarding,
  scheduleLoading = false,
  chosenDeparture,
  onChooseDeparture,
  onDeparturesLoaded,
}: TripPlanPreviewProps) {
  const stats = route.stats;
  const isNjOrigin = parseLineKey(fromKey)?.network === "njt";
  const connection = tripConnectionLabel(route);
  const isDirect = connection === "Direct";
  const displaySteps = routeStepsForDisplay(route.steps);

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
        <p
          className={`trip-plan-connection-tag ${isDirect ? "trip-plan-connection-tag--direct" : "trip-plan-connection-tag--transfer"}`}
        >
          {connection}
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
          boarding={boarding}
          loading={scheduleLoading}
          selected={chosenDeparture}
          onSelect={onChooseDeparture}
          onDeparturesLoaded={onDeparturesLoaded}
        />
      ) : (
        <p className="trip-departure-hint">
          Subway-only trip — use live trains on the map after you start.
        </p>
      )}

      {!isDirect && (
        <div className="trip-plan-transfer-callout" role="note">
          {connection}
        </div>
      )}

      <details className="trip-plan-steps" open={!isDirect}>
        <summary className="trip-plan-steps-summary">Step-by-step directions</summary>
        <TripTimeline steps={displaySteps} />
      </details>
      <p className="trip-plan-footnote">
        Walk times are estimates. Live train positions update in the map panel after you start.
      </p>
    </div>
  );
}
