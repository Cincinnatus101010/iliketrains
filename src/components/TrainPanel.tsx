import { Badge, Button, Card, Stack, Typography } from "@iantroisi/ui";
import type { NjTrain } from "../types";

type TrainPanelProps = {
  trains: NjTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  onRefresh: () => void;
};

export function TrainPanel({ trains, loading, validating, updatedAt, onRefresh }: TrainPanelProps) {
  const sorted = [...trains].sort((a, b) => a.route.localeCompare(b.route) || a.label.localeCompare(b.label));

  return (
    <Card title="NJ Rail Live" className="train-panel">
      <Stack direction="column" gap={4}>
        <Stack direction="row" gap={2} align="center">
          <Button size="sm" variant="primary" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          <Typography variant="small" tone="muted">
            {validating ? "Updating…" : updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "—"}
          </Typography>
        </Stack>
        <Typography variant="small" tone="muted">
          {trains.length} train{trains.length === 1 ? "" : "s"} · auto refresh 20s (steddy)
        </Typography>
        <Stack direction="column" gap={2} className="train-list">
          {loading && trains.length === 0 && <Typography tone="muted">Loading…</Typography>}
          {!loading && trains.length === 0 && <Typography tone="muted">No trains on map right now.</Typography>}
          {sorted.slice(0, 80).map((train) => (
            <button key={train.id} type="button" className="train-row">
              <Badge className="train-route-badge" style={{ background: train.color, color: "#fff" }}>
                {train.route}
              </Badge>
              <Stack direction="column" gap={1} className="train-row-body">
                <Typography variant="small">{train.label}</Typography>
                <Typography variant="small" tone="muted">
                  {train.trainNumber ? `#${train.trainNumber}` : train.status}
                  {train.inMotion ? " · moving" : ""}
                </Typography>
              </Stack>
            </button>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
