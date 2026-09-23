"use client";

import { useEffect, useState } from "react";

/** Updates about once a minute while enabled (for schedule countdowns). */
export function useMinuteClock(enabled: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return nowMs;
}
