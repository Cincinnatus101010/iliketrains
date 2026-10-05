"use client";

import { parseLineKey } from "@/lib/lineKey";
import { routeStepsForDisplay } from "@/lib/trip/routeDisplaySteps";
import { tripConnectionLabel } from "@/lib/trip/tripStats";
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
  const isNjOrigin = parseLineKey(fromKey)?.network === "njt";
  const showDepartures = Boolean(boarding?.lineCode) || isNjOrigin;
  const connection = tripConnectionLabel(route);
  const isDirect = connection === "Direct";
  const displaySteps = routeStepsForDisplay(route.steps);

  return (
    <div className="trip-plan-preview">
      {showDepartures ? (
        <TripDeparturePicker
          fromKey={fromKey}
          fromName={fromName}
          route={route}
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
