import type { ComponentProps } from "react";
import type { LiveTrain } from "@/app/types";
import type { useHomeUiState } from "@/hooks/useHomeUiState";
import type { useLiveTrainFilters } from "@/hooks/useLiveTrainFilters";
import type { IncomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { DockPanel } from "../DockPanel";
import type { LinesFilterDrawer } from "../LinesFilterDrawer";
import type { MapPaneOverlays } from "../MapPaneOverlays";
import type { MapTopControls } from "../MapTopControls";
import type { NavigationSheet } from "../NavigationSheet";
import type { NjLiveMap } from "../NjLiveMap";

export type HomeUi = ReturnType<typeof useHomeUiState>;
export type HomeFilters = ReturnType<typeof useLiveTrainFilters>;

export type HomeFeed = {
  allTrains: LiveTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  njConfigured: boolean;
  refresh: () => void;
  apiError: string | null;
};

export type HomeTracking = {
  savedTrip: SavedTrip | null;
  trackingTrainId: string | null;
  mapTrackingTrainId: string | null;
  trackedTrain: LiveTrain | null;
  trackedTrainLiveKey: string | null;
  incomingTrain: IncomingTrainMapHint | null;
  isTracking: boolean;
};

export type HomeActions = {
  onTrackTrain: (trainId: string) => void;
  onStartTrip: (trip: SavedTrip) => void;
  stopTracking: () => void;
  endTrip: () => void;
};

export type HomeViews = {
  topBar: ComponentProps<typeof MapTopControls>;
  map: ComponentProps<typeof NjLiveMap>;
  mapOverlays: ComponentProps<typeof MapPaneOverlays>;
  dock: ComponentProps<typeof DockPanel>;
  lines: ComponentProps<typeof LinesFilterDrawer>;
  nav: ComponentProps<typeof NavigationSheet>;
};

export type HomeContextValue = {
  ui: HomeUi;
  feed: HomeFeed;
  tracking: HomeTracking;
  filters: HomeFilters;
  actions: HomeActions;
  views: HomeViews;
};
