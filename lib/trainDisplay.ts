import { displayLineName } from "@/lib/displayLine";
import { formatNjDateTime } from "@/lib/formatTime";
import type { LiveTrain } from "@/lib/types";

function njAtStation(train: LiveTrain): boolean {
  if (train.atStation === true) return true;
  if (train.atStation === false) return false;
  if (!train.stopName) return false;
  if (train.platformTrack) return true;
  return !train.inMotion;
}

/** Large status line while following a train (passenger / on-board view). */
export function trainFollowPrimary(train: LiveTrain): string {
  const stop = train.stopName?.trim();
  if (train.network === "mta") {
    if (train.atStation && stop) return `At ${stop}`;
    if (train.status === "Approaching" && stop) return `Approaching ${stop}`;
    if (stop) return `Next stop ${stop}`;
    if (train.status === "Between stations") return "Between stations";
    return train.label;
  }

  if (stop && njAtStation(train)) {
    if (train.platformTrack) return `At ${stop} · Track ${train.platformTrack}`;
    return `At ${stop}`;
  }
  if (stop) {
    return `Next stop ${stop}`;
  }
  return train.label;
}

/** Secondary line under follow status (schedule, delay, en-route hint). */
export function trainFollowSecondary(train: LiveTrain): string {
  if (train.network === "mta") {
    if (train.atStation) return train.status;
    if (train.status === "Approaching" && train.stopName) return "Arriving soon";
    if (train.stopName && train.status === "Between stations") {
      return `En route to ${train.stopName}`;
    }
    return train.status;
  }

  const parts: string[] = [];
  if (train.inMotion) parts.push("En route");
  else if (njAtStation(train)) parts.push("At platform");
  if (train.status && train.status !== "On schedule") parts.push(train.status);
  if (train.scheduledDeparture) parts.push(`Dep ${formatNjDateTime(train.scheduledDeparture)}`);
  return parts.join(" · ") || "Live position updating…";
}

/** Primary location / destination line for lists and map popups. */
export function trainHeadline(train: LiveTrain): string {
  if (train.network === "mta") return train.label;

  const station = train.stopName;
  if (train.platformTrack && station) {
    return `Track ${train.platformTrack} · ${station}`;
  }
  if (station && njAtStation(train)) return `At ${station}`;
  const dir = train.direction ? `${train.direction} · ` : "";
  return station ? `${dir}Next ${station}` : train.label;
}

/** Secondary status line (omit departure when shown in the time column). */
export function trainMeta(train: LiveTrain, opts?: { includeDeparture?: boolean }): string {
  if (train.network === "mta") return train.status;

  const parts: string[] = [train.status];
  if (!train.platformTrack && train.trackCircuit) {
    parts.push(`Circuit ${train.trackCircuit}`);
  }
  if (opts?.includeDeparture !== false && train.scheduledDeparture) {
    parts.push(`Dep ${formatNjDateTime(train.scheduledDeparture)}`);
  }
  if (train.trainNumber) parts.push(`#${train.trainNumber}`);
  return parts.join(" · ");
}

/** Right-aligned time or status for list rows and map popups. */
export function trainTimeLabel(train: LiveTrain): string {
  if (train.scheduledDeparture) return formatNjDateTime(train.scheduledDeparture);
  return train.status;
}

/** Short text inside the map marker badge. */
export function trainMarkerBadge(train: LiveTrain): string {
  if (train.network === "mta") return train.route;
  return train.platformTrack ?? (train.route.length > 3 ? train.route.slice(0, 3) : train.route);
}

/** Native tooltip on map markers. */
export function trainMarkerTitle(train: LiveTrain, opts?: { tracking?: boolean }): string {
  const location = opts?.tracking ? trainFollowPrimary(train) : trainHeadline(train);
  return [
    displayLineName(train),
    location,
    trainTimeLabel(train),
    train.platformTrack ? `Trk ${train.platformTrack}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function trainPopupHtml(train: LiveTrain, opts?: { tracking?: boolean }): string {
  const line = displayLineName(train);
  const network = train.network === "mta" ? "NY Subway" : "NJ Transit";
  const headline = escapeHtml(opts?.tracking ? trainFollowPrimary(train) : trainHeadline(train));
  const meta = escapeHtml(
    opts?.tracking ? trainFollowSecondary(train) : trainMeta(train, { includeDeparture: false }),
  );
  const time = escapeHtml(trainTimeLabel(train));
  const followLabel = opts?.tracking ? "Following" : "Follow train";

  return `<div class="map-train-popup">
  <p class="map-train-popup-kicker">${escapeHtml(line)} · ${network}</p>
  <p class="map-train-popup-head">${headline}</p>
  <p class="map-train-popup-time">${time}</p>
  ${meta ? `<p class="map-train-popup-meta">${meta}</p>` : ""}
  <button type="button" class="map-train-popup-follow" data-train-follow="${escapeHtml(train.id)}">${followLabel}</button>
</div>`;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
