"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createGameMap, type GameMap } from "@iantroisi/sickmaps";
import type { NjTrain } from "@/lib/types";

const CENTER: [number, number] = [-74.35, 40.65];
const ZOOM = 8.35;

type MapPadding = { top: number; bottom: number; left: number; right: number };

type NjLiveMapProps = {
  trains: NjTrain[];
  highlightLine: string | null;
  padding: MapPadding;
};

export function NjLiveMap({ trains, highlightLine, padding }: NjLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GameMap | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const layersReady = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

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

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = map;

      const onLoad = () => {
        void installRailLayers(map).then(() => {
          layersReady.current = true;
          applyLineHighlight(map, highlightLine);
        });
      };

      map.on("load", onLoad);
      if (map.isStyleLoaded()) {
        onLoad();
      }
    }

    void init();

    return () => {
      cancelled = true;
      layersReady.current = false;
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      mapRef.current?.sickmapsTeardown?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setPadding(padding);
  }, [padding]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady.current) return;
    applyLineHighlight(map, highlightLine);
  }, [highlightLine]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    for (const train of trains) {
      seen.add(train.id);
      let marker = markersRef.current.get(train.id);

      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "map-train-marker";
        const track = train.platformTrack ? ` · Trk ${train.platformTrack}` : "";
        el.title = `${train.lineName}${train.direction ? ` · ${train.direction}` : ""} · Next ${train.label}${track}`;
        el.style.background = train.color;
        el.textContent = train.platformTrack ?? (train.route.length > 3 ? train.route.slice(0, 3) : train.route);
        el.className = train.platformTrack ? "map-train-marker map-train-marker--track" : "map-train-marker";

        marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([train.longitude, train.latitude])
          .addTo(map);
        markersRef.current.set(train.id, marker);
      } else {
        marker.setLngLat([train.longitude, train.latitude]);
        const existing = marker.getElement() as HTMLButtonElement;
        existing.style.background = train.color;
        const track = train.platformTrack ? ` · Trk ${train.platformTrack}` : "";
        existing.title = `${train.lineName}${train.direction ? ` · ${train.direction}` : ""} · Next ${train.label}${track}`;
        existing.textContent = train.platformTrack ?? (train.route.length > 3 ? train.route.slice(0, 3) : train.route);
        existing.className = train.platformTrack
          ? "map-train-marker map-train-marker--track"
          : "map-train-marker";
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [trains]);

  return <div ref={containerRef} className="nj-map" aria-label="NJ Transit live map" />;
}

function applyLineHighlight(map: GameMap, highlightLine: string | null) {
  if (!map.getLayer("nj-tracks-line")) return;

  if (!highlightLine) {
    map.setPaintProperty("nj-tracks-line", "line-opacity", 0.82);
    map.setPaintProperty("nj-tracks-casing", "line-opacity", 0.45);
    return;
  }

  map.setPaintProperty("nj-tracks-line", "line-opacity", [
    "case",
    ["==", ["get", "route"], highlightLine],
    1,
    0.1,
  ]);
  map.setPaintProperty("nj-tracks-casing", "line-opacity", [
    "case",
    ["==", ["get", "route"], highlightLine],
    0.55,
    0.06,
  ]);
}

async function installRailLayers(map: GameMap) {
  if (map.getSource("nj-tracks")) return;

  const res = await fetch("/data/nj-rail-tracks.geojson");
  const data = await res.json();

  map.addSource("nj-tracks", { type: "geojson", data });
  map.addLayer({
    id: "nj-tracks-casing",
    type: "line",
    source: "nj-tracks",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#0a0a0a", "line-width": 7, "line-opacity": 0.45 },
  });
  map.addLayer({
    id: "nj-tracks-line",
    type: "line",
    source: "nj-tracks",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#888"],
      "line-width": 4,
      "line-opacity": 0.82,
    },
  });
}
