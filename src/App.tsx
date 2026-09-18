import { useEffect } from "react";
import { pollingRevalidate, serializeKey, useSteddy, type Coordinator } from "steddy";
import { AppShell, Banner, Stack } from "@iantroisi/ui";
import { fetchNjTrains } from "./api/trains";
import { NjLiveMap } from "./components/NjLiveMap";
import { TrainPanel } from "./components/TrainPanel";

const TRAINS_KEY = ["nj-trains"] as const;
const POLL_MS = 20_000;

type AppProps = {
  coordinator: Coordinator;
};

export function App({ coordinator }: AppProps) {
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
            <code>.env.local</code> (RailData developer account).
          </Banner>
        )}
        {apiError && (
          <Banner variant="danger">{apiError}</Banner>
        )}
        <NjLiveMap trains={trains} />
      </Stack>
    </AppShell>
  );
}
