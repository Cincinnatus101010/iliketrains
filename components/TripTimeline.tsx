"use client";

import type { RouteStep } from "@/lib/trip/types";

type TripTimelineProps = {
  steps: RouteStep[];
  compact?: boolean;
};

function stepTitle(step: RouteStep): string {
  if (step.kind === "walk") {
    return step.fromName === step.toName ? "Walk" : `Walk to ${step.toName}`;
  }
  if (step.kind === "stay") return step.fromName;
  const route = step.route ?? "Train";
  return step.fromName === step.toName
    ? `Take ${route}`
    : `Take ${route} toward ${step.toName}`;
}

function stepDetail(step: RouteStep): string | null {
  if (step.kind === "ride" && step.fromName !== step.toName) {
    return `${step.fromName} → ${step.toName}`;
  }
  if (step.kind === "walk" && step.fromName !== step.toName) {
    return `${step.fromName} → ${step.toName}`;
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
          <li key={`${step.kind}-${step.fromName}-${i}`} className={`trip-timeline-item trip-timeline-item--${step.kind}`}>
            <div className="trip-timeline-gutter" aria-hidden>
              <span className="trip-timeline-dot" />
              {!isLast && <span className="trip-timeline-line" />}
            </div>
            <div className="trip-timeline-body">
              <div className="trip-timeline-head">
                {step.kind === "ride" && step.route ? (
                  <span className="trip-timeline-badge" style={{ background: step.color ?? "#444" }}>
                    {step.route}
                  </span>
                ) : step.kind === "walk" ? (
                  <span className="trip-timeline-badge trip-timeline-badge--walk">Walk</span>
                ) : null}
                <span className="trip-timeline-title">{stepTitle(step)}</span>
              </div>
              {!compact && detail && <p className="trip-timeline-detail">{detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
