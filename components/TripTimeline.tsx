"use client";

import { formatWalkDistance } from "@/lib/trip/geo";
import { tripLineLabel } from "@/lib/trip/lineLabel";
import type { RouteStep } from "@/lib/trip/types";

type TripTimelineProps = {
  steps: RouteStep[];
  compact?: boolean;
};

function stepTitle(step: RouteStep): string {
  if (step.kind === "walk") {
    if (step.fromName === step.toName) return "Walk";
    const mins = step.walkMinutes;
    const suffix = mins ? ` · ~${mins} min` : "";
    return `Transfer · walk to ${step.toName}${suffix}`;
  }
  if (step.kind === "stay") return `Stay at ${step.fromName}`;
  const line = tripLineLabel(step.network, step.route ?? "");
  if (step.fromName === step.toName) return `Board ${line}`;
  return `${line} to ${step.toName}`;
}

function stepDetail(step: RouteStep): string | null {
  if (step.kind === "ride" && step.fromName !== step.toName) {
    return `Board at ${step.fromName} · exit at ${step.toName}`;
  }
  if (step.kind === "walk" && step.walkDistanceM != null && step.walkDistanceM > 0) {
    return formatWalkDistance(step.walkDistanceM);
  }
  return null;
}

export function TripTimeline({ steps, compact = false }: TripTimelineProps) {
  return (
    <ol className={`trip-timeline ${compact ? "trip-timeline--compact" : ""}`}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const detail = stepDetail(step);
        return (
          <li
            key={`${step.kind}-${step.fromKey ?? step.fromName}-${i}`}
            className={`trip-timeline-item trip-timeline-item--${step.kind}`}
          >
            <div className="trip-timeline-gutter" aria-hidden>
              <span className="trip-timeline-dot" />
              {!isLast && <span className="trip-timeline-line" />}
            </div>
            <div className="trip-timeline-body">
              <div className="trip-timeline-head">
                {step.kind === "ride" && step.route ? (
                  <span
                    className="trip-timeline-badge"
                    style={{ background: step.color ?? "#444" }}
                    title={tripLineLabel(step.network, step.route)}
                  >
                    {step.route}
                  </span>
                ) : step.kind === "walk" ? (
                  <span className="trip-timeline-badge trip-timeline-badge--walk">Transfer</span>
                ) : null}
                <span className="trip-timeline-title">{stepTitle(step)}</span>
              </div>
              {(!compact || step.kind === "walk") && detail && (
                <p className="trip-timeline-detail">{detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
