"use client";

import { useState } from "react";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { tripSummaryLabel } from "@/lib/trip/savedTrip";
import { TripTimeline } from "./TripTimeline";

type ActiveTripCardProps = {
  trip: SavedTrip;
  onEdit: () => void;
  onEnd: () => void;
};

export function ActiveTripCard({ trip, onEdit, onEnd }: ActiveTripCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`active-trip-card glass ${expanded ? "active-trip-card--expanded" : ""}`}>
      <div className="active-trip-card-main">
        <button
          type="button"
          className="active-trip-card-end"
          onClick={onEnd}
          aria-label="End trip"
        >
          End
        </button>
        <button
          type="button"
          className="active-trip-card-summary"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          <span className="active-trip-card-kicker">Active trip</span>
          <span className="active-trip-card-dest">{trip.toName}</span>
          <span className="active-trip-card-meta">
            from {trip.fromName} · {tripSummaryLabel(trip)}
          </span>
        </button>
        <button
          type="button"
          className="active-trip-card-edit"
          onClick={onEdit}
          aria-label="Edit trip"
        >
          Edit
        </button>
      </div>
      {expanded && (
        <div className="active-trip-card-steps">
          <TripTimeline steps={trip.route.steps} compact />
        </div>
      )}
    </div>
  );
}
