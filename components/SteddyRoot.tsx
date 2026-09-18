"use client";

import { useEffect, useMemo } from "react";
import { attachDefaults, createRuntime, SteddyProvider } from "steddy";
import { HomeClient } from "./HomeClient";

export function SteddyRoot() {
  const runtime = useMemo(() => createRuntime(), []);

  useEffect(() => attachDefaults(runtime.coordinator, runtime.store), [runtime]);

  return (
    <SteddyProvider store={runtime.store} coordinator={runtime.coordinator}>
      <HomeClient coordinator={runtime.coordinator} />
    </SteddyProvider>
  );
}
