"use client";

import { createGameMap, type GameMap } from "@iantroisi/sickmaps";
import maplibregl from "maplibre-gl";
import { useEffect, useLayoutEffect, useRef } from "react";
import { type LineKey, parseLineKey } from "@/lib/lineKey";
import { observeMapContainerResize } from "@/lib/map/mapResize";
import { TrackEngine } from "@/lib/map/trackEngine";
import { TrainMarkerController } from "@/lib/map/trainMarkerController";
import type { LiveTrain } from "@/lib/types";

const CENTER: [number, number] = [-74.02, 40.72];
const ZOOM = 9.1;

type MapPadding = { top: number; bottom: number; left: number; right: number };

type NjLiveMapProps = {
  trains: LiveTrain[];
  trainsSignature: string;
  highlightLine: LineKey | null;
  padding: MapPadding;
  plannedRoute: [number, number][] | null;
  plannedRouteFitKey: string | null;
  tripHighlightTrainIds: Set<string>;
  tripHighlightKey: string;
  trackingTrainId: string | null;
  trackingTrainLiveKey: string | null;
  onTrackTrain: (trainId: string) => void;
  onStopTracking: () => void;
};

export function NjLiveMap({
  trains,
  trainsSignature,
  highlightLine,
  padding,
  plannedRoute,
  plannedRouteFitKey,
  tripHighlightTrainIds,
  tripHighlightKey,
  trackingTrainId,
  trackingTrainLiveKey,
  onTrackTrain,
  onStopTracking,
}: NjLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GameMap | null>(null);
  const engineRef = useRef<TrackEngine | null>(null);
  const markersRef = useRef<TrainMarkerController | null>(null);
  const layersReady = useRef(false);
  const lastRouteFitKeyRef = useRef<string | null>(null);
  const trainsRef = useRef(trains);
  trainsRef.current = trains;
  const onTrackTrainRef = useRef(onTrackTrain);
  onTrackTrainRef.current = onTrackTrain;
  const onStopTrackingRef = useRef(onStopTracking);
  onStopTrackingRef.current = onStopTracking;
  const trackingTrainIdRef = useRef(trackingTrainId);
  trackingTrainIdRef.current = trackingTrainId;
  const tripHighlightTrainIdsRef = useRef(tripHighlightTrainIds);
  tripHighlightTrainIdsRef.current = tripHighlightTrainIds;
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const followPanFromMapRef = useRef(false);
  const prevFollowIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stopResizeObserve: (() => void) | null = null;
    let stopViewListeners: (() => void) | null = null;
    const engine = new TrackEngine();
    engineRef.current = engine;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      await engine.loadFromUrls(["/data/subway-tracks.geojson", "/data/nj-rail-tracks.geojson"]);

      const map = await createGameMap(maplibregl, {
        theme: "gta-v",
        container: containerRef.current,
        center: CENTER,
        zoom: ZOOM,
        padding,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      const controller = new TrainMarkerController(map, engine);
      markersRef.current = controller;

      const onUserPan = () => {
        if (trackingTrainIdRef.current) onStopTrackingRef.current();
      };
      map.on("dragstart", onUserPan);
      map.on("rotatestart", onUserPan);
      map.on("pitchstart", onUserPan);

      const onViewSettled = () => {
        if (followPanFromMapRef.current) {
          followPanFromMapRef.current = false;
        }
        controller.refreshPositions();
      };
      map.on("zoomend", onViewSettled);
      map.on("moveend", onViewSettled);
      map.on("pitchend", onViewSettled);
      stopViewListeners = () => {
        map.off("zoomend", onViewSettled);
        map.off("moveend", onViewSettled);
        map.off("pitchend", onViewSettled);
        map.off("dragstart", onUserPan);
        map.off("rotatestart", onUserPan);
        map.off("pitchstart", onUserPan);
      };

      const onLoad = () => {
        void installTrackLayers(map).then(() => {
          ensurePlannedRouteLayer(map);
          layersReady.current = true;
          applyLineHighlight(map, highlightLine);
          controller.sync(trainsRef.current);
        });
      };

      map.on("load", onLoad);
      if (map.isStyleLoaded()) {
        onLoad();
      }

      stopResizeObserve = observeMapContainerResize(containerRef.current, () => {
        map.resize();
        controller.refreshPositions();
      });
    }

    void init();

    return () => {
      cancelled = true;
      layersReady.current = false;
      stopViewListeners?.();
      stopResizeObserve?.();
      markersRef.current?.dispose();
      markersRef.current = null;
      engineRef.current = null;
      mapRef.current?.sickmapsTeardown?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Map init runs once; padding, highlights, and trains sync in useLayoutEffect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useLayoutEffect(() => {
    const map = mapRef.current;
    const controller = markersRef.current;
    if (!map || !controller || !layersReady.current) return;

    map.setPadding(padding);
    applyLineHighlight(map, highlightLine);
    controller.sync(trains);
    controller.setTripHighlightTrainIds(tripHighlightTrainIdsRef.current);

    const panToTrain = (lngLat: [number, number]) => {
      followPanFromMapRef.current = true;
      map.jumpTo({
        center: lngLat,
        zoom: Math.max(map.getZoom(), 12.5),
        padding,
      });
    };

    controller.setFollowHandlers(
      trackingTrainId,
      onTrackTrain,
      trackingTrainId ? (lngLat) => panToTrain(lngLat) : null,
    );

    if (trackingTrainId && trackingTrainLiveKey) {
      const train = trains.find((t) => t.id === trackingTrainId);
      if (train) {
        const initialFocus = prevFollowIdRef.current !== trackingTrainId;
        prevFollowIdRef.current = trackingTrainId;
        followPanFromMapRef.current = true;
        const center: [number, number] = [train.longitude, train.latitude];
        const zoom = Math.max(map.getZoom(), 12.5);
        if (initialFocus) {
          map.easeTo({ center, zoom, duration: 700, padding, essential: true });
        } else {
          map.jumpTo({ center, zoom, padding });
        }
      }
    } else {
      prevFollowIdRef.current = null;
    }

    ensurePlannedRouteLayer(map);
    const source = map.getSource("planned-route") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      if (!plannedRoute || plannedRoute.length < 2) {
        lastRouteFitKeyRef.current = null;
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      } else {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: plannedRoute },
        });

        if (plannedRouteFitKey && plannedRouteFitKey !== lastRouteFitKeyRef.current) {
          lastRouteFitKeyRef.current = plannedRouteFitKey;
          const lons = plannedRoute.map((c) => c[0]);
          const lats = plannedRoute.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lons), Math.min(...lats)],
              [Math.max(...lons), Math.max(...lats)],
            ],
            { padding: 48, duration: 900, maxZoom: 14 },
          );
        }
      }
    }
  }, [
    trains,
    trainsSignature,
    highlightLine,
    padding,
    tripHighlightKey,
    trackingTrainId,
    trackingTrainLiveKey,
    onTrackTrain,
    plannedRoute,
    plannedRouteFitKey,
  ]);

  return <div ref={containerRef} className="nj-map" aria-label="NYC and NJ live transit map" />;
}

function ensurePlannedRouteLayer(map: GameMap) {
  if (map.getSource("planned-route")) return;

  map.addSource("planned-route", {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
  });
  map.addLayer({
    id: "planned-route-casing",
    type: "line",
    source: "planned-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#fff", "line-width": 8, "line-opacity": 0.85 },
  });
  map.addLayer({
    id: "planned-route-line",
    type: "line",
    source: "planned-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#fccc0a", "line-width": 4, "line-opacity": 1 },
  });
}

function applyLineHighlight(map: GameMap, highlightLine: LineKey | null) {
  const parsed = parseLineKey(highlightLine);

  if (!parsed) {
    setTrackOpacity(map, "subway-tracks-line", "subway-tracks-casing", null, true);
    setTrackOpacity(map, "nj-tracks-line", "nj-tracks-casing", null, true);
    return;
  }

  if (parsed.network === "mta") {
    setTrackOpacity(map, "subway-tracks-line", "subway-tracks-casing", parsed.route, true);
    setTrackOpacity(map, "nj-tracks-line", "nj-tracks-casing", null, false);
  } else {
    setTrackOpacity(map, "nj-tracks-line", "nj-tracks-casing", parsed.route, true);
    setTrackOpacity(map, "subway-tracks-line", "subway-tracks-casing", null, false);
  }
}

function setTrackOpacity(
  map: GameMap,
  lineLayer: string,
  casingLayer: string,
  route: string | null,
  networkActive: boolean,
) {
  if (!map.getLayer(lineLayer)) return;

  if (!route) {
    if (networkActive) {
      map.setPaintProperty(lineLayer, "line-opacity", 0.82);
      map.setPaintProperty(casingLayer, "line-opacity", 0.45);
    } else {
      map.setPaintProperty(lineLayer, "line-opacity", 0.08);
      map.setPaintProperty(casingLayer, "line-opacity", 0.04);
    }
    return;
  }

  map.setPaintProperty(lineLayer, "line-opacity", [
    "case",
    ["==", ["get", "route"], route],
    1,
    networkActive ? 0.1 : 0.06,
  ]);
  map.setPaintProperty(casingLayer, "line-opacity", [
    "case",
    ["==", ["get", "route"], route],
    0.55,
    networkActive ? 0.06 : 0.03,
  ]);
}

async function installTrackLayers(map: GameMap) {
  await addGeoJsonLineLayer(map, "subway-tracks", "/data/subway-tracks.geojson");
  await addGeoJsonLineLayer(map, "nj-tracks", "/data/nj-rail-tracks.geojson");
}

async function addGeoJsonLineLayer(map: GameMap, sourceId: string, url: string) {
  if (map.getSource(sourceId)) return;

  const res = await fetch(url);
  const data = await res.json();

  map.addSource(sourceId, { type: "geojson", data });
  map.addLayer({
    id: `${sourceId}-casing`,
    type: "line",
    source: sourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#0a0a0a", "line-width": 7, "line-opacity": 0.45 },
  });
  map.addLayer({
    id: `${sourceId}-line`,
    type: "line",
    source: sourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#888"],
      "line-width": 4,
      "line-opacity": 0.82,
    },
  });
}
