"use client";

import { useEffect, useRef } from "react";

type UseMissedPollGraceOptions = {
  maxMisses: number;
  onExpire: () => void;
};

/**
 * Counts consecutive observations where `active && !present`; calls onExpire after maxMisses.
 */
export function useMissedPollGrace(
  active: boolean,
  present: boolean,
  { maxMisses, onExpire }: UseMissedPollGraceOptions,
): void {
  const misses = useRef(0);

  useEffect(() => {
    if (!active) {
      misses.current = 0;
      return;
    }
    if (present) {
      misses.current = 0;
      return;
    }
    misses.current += 1;
    if (misses.current >= maxMisses) {
      misses.current = 0;
      onExpire();
    }
  }, [active, present, maxMisses, onExpire]);
}
