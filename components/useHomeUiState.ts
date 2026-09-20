"use client";

import { useCallback, useState } from "react";
import { activeLineMatchesScope, type LineKey } from "@/lib/lineKey";
import type { MapScope } from "@/lib/types";

export function useHomeUiState() {
  const [scope, setScope] = useState<MapScope>("all");
  const [activeLine, setActiveLine] = useState<LineKey | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

  const onScopeChange = useCallback((next: MapScope) => {
    setScope(next);
    setActiveLine((line) => (activeLineMatchesScope(line, next) ? line : null));
  }, []);

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const openLines = useCallback(() => setLinesOpen(true), []);
  const closeLines = useCallback(() => setLinesOpen(false), []);
  const expandDock = useCallback(() => setBottomCollapsed(false), []);

  return {
    scope,
    activeLine,
    setActiveLine,
    onScopeChange,
    navOpen,
    openNav,
    closeNav,
    linesOpen,
    openLines,
    closeLines,
    bottomCollapsed,
    setBottomCollapsed,
    expandDock,
  };
}
