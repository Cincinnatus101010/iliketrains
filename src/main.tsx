import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SteddyProvider, attachDefaults, createRuntime } from "steddy";
import "@iantroisi/ui/styles.css";
import "@iantroisi/sickmaps/css";
import "maplibre-gl/dist/maplibre-gl.css";
import { App } from "./App";
import "./app.css";

const runtime = createRuntime();

function Root() {
  useEffect(() => attachDefaults(runtime.coordinator, runtime.store), []);

  return (
    <SteddyProvider store={runtime.store} coordinator={runtime.coordinator}>
      <App coordinator={runtime.coordinator} />
    </SteddyProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
