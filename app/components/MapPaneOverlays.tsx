type MapPaneOverlaysProps = {
  njConfigured: boolean;
  apiError: string | null;
  navOpen: boolean;
  onOpenNav: () => void;
};

export function MapPaneOverlays({
  njConfigured,
  apiError,
  navOpen,
  onOpenNav,
}: MapPaneOverlaysProps) {
  return (
    <>
      {!njConfigured && (
        <div className="map-pane-alert glass" role="status">
          Set <code>NJTRANSIT_USERNAME</code> / <code>NJTRANSIT_PASSWORD</code> in{" "}
          <code>.env.local</code>
        </div>
      )}
      {apiError && (
        <div className="map-pane-alert glass map-pane-alert--error" role="alert">
          {apiError}
        </div>
      )}

      <button
        type="button"
        className="nav-fab"
        aria-label="Plan a trip"
        aria-expanded={navOpen}
        onClick={onOpenNav}
      >
        <span className="nav-fab-icon" aria-hidden>
          +
        </span>
      </button>
    </>
  );
}
