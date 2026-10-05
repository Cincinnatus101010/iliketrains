"use client";

import dynamic from "next/dynamic";
import { DockPanel } from "./DockPanel";
import { HomeProvider, useHome } from "./home/HomeProvider";
import { LinesFilterDrawer } from "./LinesFilterDrawer";
import { MapPaneOverlays } from "./MapPaneOverlays";
import { MapTopControls } from "./MapTopControls";

const NavigationSheet = dynamic(() => import("./NavigationSheet").then((m) => m.NavigationSheet), {
  ssr: false,
});

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

export function HomeClient() {
  return (
    <HomeProvider>
      <HomeScreen />
    </HomeProvider>
  );
}

function HomeScreen() {
  const { ui } = useHome();
  const frameClassName = `app-frame troisi-root ${ui.bottomCollapsed ? "app-frame--bottom-collapsed" : ""}`;

  return (
    <div className={frameClassName}>
      <HomeTopBar />
      <HomeMapArea />
      <HomeDock />
      <HomeLinesMenu />
      <HomeTripPlanner />
    </div>
  );
}

function HomeTopBar() {
  const { views } = useHome();
  return <MapTopControls {...views.topBar} />;
}

function HomeMapArea() {
  const { views } = useHome();
  return (
    <section className="map-pane" aria-label="Map">
      <NjLiveMap {...views.map} />
      <MapPaneOverlays {...views.mapOverlays} />
    </section>
  );
}

function HomeDock() {
  const { ui, views } = useHome();
  return (
    <section className="bottom-pane glass" aria-label="Live trains">
      {!ui.bottomCollapsed && <DockPanel {...views.dock} />}
    </section>
  );
}

function HomeLinesMenu() {
  const { views } = useHome();
  return <LinesFilterDrawer {...views.lines} />;
}

function HomeTripPlanner() {
  const { views } = useHome();
  return <NavigationSheet {...views.nav} />;
}
