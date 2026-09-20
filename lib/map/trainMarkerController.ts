import maplibregl from "maplibre-gl";
import { TRAIN_MISSED_FEED_POLLS } from "@/lib/liveTracking";
import { trainMarkerBadge, trainMarkerTitle, trainPopupHtml } from "@/lib/trainDisplay";
import type { LiveTrain, Network } from "@/lib/types";
import { shortestTrackGap, type TrackEngine, wrapTrackDist } from "./trackEngine";
import { trainVisualKey } from "./trainSyncKey";

const GLIDE_MIN_GAP_M = 25;
const MAX_GLIDE_M = 3200;
const REMOVE_AFTER_MISSED_POLLS = TRAIN_MISSED_FEED_POLLS;

type TrackTarget = { lat: number; lon: number; trackDist: number | null };

type TrackMarkerState = {
  train: LiveTrain;
  marker: maplibregl.Marker;
  contentRoot: HTMLElement;
  trackDist: number | null;
  targetTrackDist: number | null;
  trackFromDist: number | null;
  animEndDist: number | null;
  animStart: number;
  animDuration: number;
  missedPolls: number;
  visualKey: string;
  motionKey: string;
};

function animationDurationForGap(gapM: number, network: Network): number {
  const min = network === "mta" ? 1_500 : 3_000;
  const max = network === "mta" ? 4_500 : 17_000;
  const scaled = min + (gapM / 400) * (max - min);
  return Math.max(min, Math.min(max, scaled));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export class TrainMarkerController {
  private map: maplibregl.Map;
  private engine: TrackEngine;
  private states = new Map<string, TrackMarkerState>();
  private animFrame: number | null = null;
  private activePopup: maplibregl.Popup | null = null;
  private tripHighlightIds = new Set<string>();
  private trackingTrainId: string | null = null;
  private onTrackTrain: ((trainId: string) => void) | null = null;
  private onTrackingPan: ((lngLat: [number, number]) => void) | null = null;
  private lastTrackingPanLngLat: [number, number] | null = null;

  constructor(map: maplibregl.Map, engine: TrackEngine) {
    this.map = map;
    this.engine = engine;
  }

  refreshPositions(): void {
    for (const state of this.states.values()) {
      this.applyMarkerPosition(state);
    }
  }

  sync(trains: LiveTrain[]): void {
    const now = performance.now();
    const seen = new Set<string>();

    for (const train of trains) {
      seen.add(train.id);
      this.syncTrain(train, now);
    }

    for (const [id, state] of this.states) {
      if (seen.has(id)) continue;
      state.missedPolls += 1;
      if (state.missedPolls < REMOVE_AFTER_MISSED_POLLS) continue;
      state.marker.remove();
      this.states.delete(id);
    }

    this.ensureAnimationLoop();
  }

  setTripHighlightTrainIds(ids: Set<string>): void {
    if (setsEqual(ids, this.tripHighlightIds)) return;
    this.tripHighlightIds = ids;
    for (const state of this.states.values()) {
      this.refreshMarkerVisual(state);
    }
  }

  setTrackingHandlers(
    trackingTrainId: string | null,
    onTrackTrain: ((trainId: string) => void) | null,
    onTrackingPan: ((lngLat: [number, number]) => void) | null,
  ): void {
    const idChanged = this.trackingTrainId !== trackingTrainId;
    this.trackingTrainId = trackingTrainId;
    this.onTrackTrain = onTrackTrain;
    this.onTrackingPan = onTrackingPan;
    if (!trackingTrainId) this.lastTrackingPanLngLat = null;

    for (const state of this.states.values()) {
      this.refreshMarkerVisual(state);
    }

    if (idChanged && trackingTrainId) {
      this.focusTrackedTrain();
    }
  }

  focusTrackedTrain(): void {
    if (!this.trackingTrainId || !this.onTrackingPan) return;
    const state = this.states.get(this.trackingTrainId);
    if (!state) return;
    const { lng, lat } = state.marker.getLngLat();
    this.onTrackingPan([lng, lat]);
  }

  private emitTrackingPan(state: TrackMarkerState): void {
    if (!this.trackingTrainId || state.train.id !== this.trackingTrainId || !this.onTrackingPan) {
      return;
    }
    const { lng, lat } = state.marker.getLngLat();
    const prev = this.lastTrackingPanLngLat;
    if (prev && Math.abs(prev[0] - lng) < 1e-6 && Math.abs(prev[1] - lat) < 1e-6) {
      return;
    }
    this.lastTrackingPanLngLat = [lng, lat];
    this.onTrackingPan([lng, lat]);
  }

  dispose(): void {
    if (this.animFrame != null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.activePopup?.remove();
    this.activePopup = null;
    for (const state of this.states.values()) state.marker.remove();
    this.states.clear();
  }

  private resolveTarget(train: LiveTrain): TrackTarget {
    const hit = this.engine.project(train.route, train.latitude, train.longitude);
    if (hit) {
      return { lat: hit.lat, lon: hit.lon, trackDist: hit.trackDist };
    }
    return { lat: train.latitude, lon: train.longitude, trackDist: null };
  }

  private syncTrain(train: LiveTrain, now: number): void {
    const target = this.resolveTarget(train);
    let state = this.states.get(train.id);

    if (!state) {
      const { marker, contentRoot } = this.createMarker(train);
      marker.setLngLat([target.lon, target.lat]).addTo(this.map);
      state = {
        train,
        marker,
        contentRoot,
        trackDist: target.trackDist,
        targetTrackDist: target.trackDist,
        trackFromDist: target.trackDist,
        animEndDist: target.trackDist,
        animStart: 0,
        animDuration: 0,
        missedPolls: 0,
        visualKey: "",
        motionKey: "",
      };
      state.visualKey = trainVisualKey(train);
      state.motionKey = `${train.latitude.toFixed(5)},${train.longitude.toFixed(5)}`;
      this.states.set(train.id, state);
      this.refreshMarkerVisual(state);
      return;
    }

    state.missedPolls = 0;

    const motionKey = `${train.latitude.toFixed(5)},${train.longitude.toFixed(5)},${train.stopName ?? ""},${train.atStation ? 1 : 0},${train.status}`;
    const visualKey = trainVisualKey(train);
    const motionUnchanged = motionKey === state.motionKey;
    const visualUnchanged = visualKey === state.visualKey;

    state.train = train;
    if (!visualUnchanged) this.refreshMarkerVisual(state);
    state.visualKey = visualKey;
    this.refreshTrackingPopup(state);

    if (motionUnchanged && target.trackDist != null && state.targetTrackDist === target.trackDist) {
      this.emitTrackingPan(state);
      return;
    }
    state.motionKey = motionKey;

    if (target.trackDist == null) {
      state.trackDist = null;
      state.targetTrackDist = null;
      state.animDuration = 0;
      state.marker.setLngLat([target.lon, target.lat]);
      this.emitTrackingPan(state);
      return;
    }

    this.scheduleGlide(state, target, now);
  }

  private scheduleGlide(state: TrackMarkerState, target: TrackTarget, now: number): void {
    if (target.trackDist == null) return;

    const track = this.engine.getRoute(state.train.route);
    const currentDist =
      state.trackDist != null && state.animDuration > 0
        ? state.trackDist
        : (state.trackDist ?? target.trackDist);
    const { endDist, gapM } = shortestTrackGap(track, currentDist, target.trackDist);
    state.targetTrackDist = target.trackDist;

    if (gapM < GLIDE_MIN_GAP_M) {
      state.trackDist = target.trackDist;
      state.animEndDist = target.trackDist;
      state.animDuration = 0;
      state.marker.setLngLat([target.lon, target.lat]);
      this.emitTrackingPan(state);
      return;
    }

    if (gapM > MAX_GLIDE_M) {
      state.trackDist = target.trackDist;
      state.animEndDist = target.trackDist;
      state.animDuration = 0;
      state.marker.setLngLat([target.lon, target.lat]);
      this.emitTrackingPan(state);
      return;
    }

    state.trackFromDist = currentDist;
    state.animEndDist = endDist;
    state.animStart = now;
    state.animDuration = animationDurationForGap(gapM, state.train.network);
  }

  private applyMarkerPosition(state: TrackMarkerState): void {
    if (state.trackDist != null && state.animDuration > 0) {
      const pt = this.engine.pointAtDist(state.train.route, state.trackDist);
      if (pt) state.marker.setLngLat([pt.lon, pt.lat]);
      return;
    }

    const target = this.resolveTarget(state.train);
    if (target.trackDist != null) {
      state.trackDist = target.trackDist;
      state.marker.setLngLat([target.lon, target.lat]);
    } else {
      state.marker.setLngLat([target.lon, target.lat]);
    }
  }

  private createMarker(train: LiveTrain): { marker: maplibregl.Marker; contentRoot: HTMLElement } {
    const root = document.createElement("div");
    root.className = "map-train-marker-root";

    const shell = document.createElement("div");
    shell.className = "map-train-marker-shell";

    const trainId = train.id;
    const el = document.createElement("button");
    el.type = "button";
    shell.appendChild(el);
    root.appendChild(shell);

    const marker = new maplibregl.Marker({
      element: root,
      anchor: "center",
      pitchAlignment: "map",
      rotationAlignment: "map",
    });

    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const state = this.states.get(trainId);
      if (!state) return;
      this.openPopup(marker, state.train);
    });

    return { marker, contentRoot: shell };
  }

  private refreshTrackingPopup(state: TrackMarkerState): void {
    if (!this.activePopup || this.trackingTrainId !== state.train.id) return;
    this.activePopup.setLngLat(state.marker.getLngLat());
    this.activePopup.setHTML(
      trainPopupHtml(state.train, { tracking: this.trackingTrainId === state.train.id }),
    );
    const followBtn = this.activePopup
      .getElement()
      ?.querySelector<HTMLButtonElement>("[data-train-follow]");
    followBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onTrackTrain?.(state.train.id);
      this.activePopup?.remove();
    });
  }

  private openPopup(marker: maplibregl.Marker, train: LiveTrain): void {
    this.activePopup?.remove();
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 14,
      className: "map-train-popup-wrap",
      maxWidth: "240px",
    })
      .setLngLat(marker.getLngLat())
      .setHTML(trainPopupHtml(train, { tracking: this.trackingTrainId === train.id }))
      .addTo(this.map);

    const followBtn = popup.getElement()?.querySelector<HTMLButtonElement>("[data-train-follow]");
    followBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onTrackTrain?.(train.id);
      popup.remove();
    });

    popup.on("close", () => {
      if (this.activePopup === popup) this.activePopup = null;
    });
    this.activePopup = popup;
  }

  private refreshMarkerVisual(state: TrackMarkerState): void {
    const train = state.train;
    const el = state.contentRoot.querySelector("button");
    if (!el) return;

    const onTrip = this.tripHighlightIds.has(train.id);
    const followed = this.trackingTrainId === train.id;

    el.className = [
      "map-train-marker",
      train.platformTrack ? "map-train-marker--track" : "",
      train.inMotion ? "map-train-marker--moving" : "",
      onTrip ? "map-train-marker--trip" : "",
      followed ? "map-train-marker--followed" : "",
    ]
      .filter(Boolean)
      .join(" ");
    el.style.background = train.color;
    el.textContent = trainMarkerBadge(train);
    el.title = trainMarkerTitle(train, { tracking: followed });
  }

  private ensureAnimationLoop(): void {
    if (this.animFrame != null) return;

    const tick = (now: number) => {
      let anyActive = false;

      for (const state of this.states.values()) {
        if (state.animDuration <= 0 || state.trackDist == null || state.targetTrackDist == null) {
          continue;
        }

        const track = this.engine.getRoute(state.train.route);
        if (!track) continue;

        const elapsed = now - state.animStart;
        const t = Math.min(1, elapsed / state.animDuration);
        if (t >= 1) {
          state.animDuration = 0;
          state.trackDist = state.targetTrackDist;
        } else {
          anyActive = true;
          const eased = easeInOutCubic(t);
          const from = state.trackFromDist ?? state.trackDist;
          const raw = from + ((state.animEndDist ?? state.targetTrackDist) - from) * eased;
          state.trackDist = wrapTrackDist(track, raw);
        }

        const pt = this.engine.pointAtDist(state.train.route, state.trackDist);
        if (pt) {
          state.marker.setLngLat([pt.lon, pt.lat]);
        }
        this.emitTrackingPan(state);
      }

      if (anyActive) {
        this.animFrame = requestAnimationFrame(tick);
      } else {
        this.animFrame = null;
      }
    };

    this.animFrame = requestAnimationFrame(tick);
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}
