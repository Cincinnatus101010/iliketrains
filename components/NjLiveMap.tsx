"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createGameMap, type GameMap } from "@iantroisi/sickmaps";
import type { NjTrain } from "@/lib/types";

const CENTER: [number, number] = [-74.35, 40.65];
const ZOOM = 8.4;

type NjLiveMapProps = {
  trains: NjTrain[];
};

export function NjLiveMap({ trains }: NjLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GameMap | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      const map = await createGameMap(maplibregl, {
        theme: "gta-v",
        container: containerRef.current,
        center: CENTER,
        zoom: ZOOM,
        padding: { top: 24, bottom: 24, left: 320, right: 24 },
      });

      if (cancelled) {
        map.remove();
        return;
      }

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = map;

      map.on("load", () => {
        void installRailLayers(map);
      });
      if (map.isStyleLoaded()) {
        void installRailLayers(map);
      }
    }

    void init();

    return () => {
      cancelled = true;
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      mapRef.current?.sickmapsTeardown?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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
        el.title = `${train.route} ${train.label}`;
        el.style.background = train.color;
        el.textContent = train.route.length > 3 ? train.route.slice(0, 3) : train.route;

        marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([train.longitude, train.latitude])
          .addTo(map);
        markersRef.current.set(train.id, marker);
      } else {
        marker.setLngLat([train.longitude, train.latitude]);
        const existing = marker.getElement() as HTMLButtonElement;
        existing.style.background = train.color;
        existing.title = `${train.route} ${train.label}`;
        existing.textContent = train.route.length > 3 ? train.route.slice(0, 3) : train.route;
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
    paint: { "line-color": "#111", "line-width": 6, "line-opacity": 0.5 },
  });
  map.addLayer({
    id: "nj-tracks-line",
    type: "line",
    source: "nj-tracks",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#888"],
      "line-width": 3,
      "line-opacity": 0.9,
    },
  });
}
