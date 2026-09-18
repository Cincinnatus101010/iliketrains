"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { pollingRevalidate, serializeKey, useSteddy, type Coordinator } from "steddy";
import { AppShell, Banner, Stack } from "@iantroisi/ui";
import { fetchNjTrains } from "@/lib/fetchNjTrains";
import { TrainPanel } from "./TrainPanel";

const NjLiveMap = dynamic(() => import("./NjLiveMap").then((m) => m.NjLiveMap), {
  ssr: false,
  loading: () => <div className="nj-map nj-map--loading">Loading map…</div>,
});

const TRAINS_KEY = ["nj-trains"] as const;
const POLL_MS = 20_000;

type HomeClientProps = {
  coordinator: Coordinator;
};

export function HomeClient({ coordinator }: HomeClientProps) {
  const { data, error, isLoading, isValidating } = useSteddy(TRAINS_KEY, fetchNjTrains, {
    staleTime: POLL_MS,
  });

  const refresh = () => {
    void coordinator.revalidate(serializeKey(TRAINS_KEY), fetchNjTrains, { force: true });
  };

  useEffect(() => {
    const serialized = serializeKey(TRAINS_KEY);
    return pollingRevalidate(coordinator, serialized, POLL_MS);
  }, [coordinator]);

  const trains = data?.trains ?? [];
  const apiError = data?.error ?? (error instanceof Error ? error.message : error ? String(error) : null);
  const configured = data?.configured ?? true;

  return (
    <AppShell
      className="app-shell troisi-root"
      sidebar={
        <TrainPanel
          trains={trains}
          loading={isLoading}
          validating={isValidating}
          updatedAt={data?.updatedAt}
          onRefresh={refresh}
        />
      }
    >
      <Stack direction="column" gap={1} className="app-main">
        {!configured && (
          <Banner variant="warning">
            Add <code>NJTRANSIT_USERNAME</code> and <code>NJTRANSIT_PASSWORD</code> to{" "}
            <code>.env.local</code>, then restart <code>npm run dev</code>.
          </Banner>
        )}
        {apiError && <Banner variant="danger">{apiError}</Banner>}
        <NjLiveMap trains={trains} />
      </Stack>
    </AppShell>
  );
}
