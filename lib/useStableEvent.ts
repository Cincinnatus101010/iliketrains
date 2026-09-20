"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/** Stable callback identity with always-fresh implementation (for map/event listeners). */
export function useStableEvent<T extends (...args: never[]) => unknown>(handler: T): T {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });
  return useCallback(((...args) => handlerRef.current(...args)) as T, []);
}
