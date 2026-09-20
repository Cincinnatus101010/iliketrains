"use client";

import type { UpcomingStop } from "@/lib/follow/upcomingStops";

type FollowStopListProps = {
  stops: UpcomingStop[];
  compact?: boolean;
};

export function FollowStopList({ stops, compact }: FollowStopListProps) {
  if (stops.length === 0) return null;

  return (
    <ol
      className={`follow-stop-list ${compact ? "follow-stop-list--compact" : ""}`}
      aria-label="Upcoming stops"
    >
      {stops.map((stop, index) => (
        <li
          key={`${stop.name}-${index}`}
          className={`follow-stop-item follow-stop-item--${stop.kind}`}
        >
          <span className="follow-stop-tag" aria-hidden>
            {stop.kind === "at" ? "Now" : stop.kind === "next" ? "Next" : `${index}`}
          </span>
          <span className="follow-stop-name">{stop.name}</span>
        </li>
      ))}
    </ol>
  );
}
