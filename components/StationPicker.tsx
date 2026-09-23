"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PlanStation } from "@/types";

export type { PlanStation };

type StationPickerProps = {
  label: string;
  markerClass: string;
  value: string;
  stations: PlanStation[];
  disabled?: boolean;
  onChange: (key: string) => void;
};

const MAX_RESULTS = 8;

export function StationPicker({
  label,
  markerClass,
  value,
  stations,
  disabled,
  onChange,
}: StationPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => stations.find((s) => s.key === value), [stations, value]);

  useEffect(() => {
    if (!open) setQuery(selected?.name ?? "");
  }, [open, selected?.name]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, MAX_RESULTS);
    return stations
      .filter((s) => s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [query, stations]);

  const pick = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <label className="trip-endpoint">
      <span className={`trip-endpoint-marker ${markerClass}`} aria-hidden />
      <span className="trip-endpoint-field station-picker" ref={rootRef}>
        <span className="trip-planner-label">{label}</span>
        <input
          className="trip-planner-select station-picker-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : (selected?.name ?? "")}
          placeholder="Search stations…"
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.name ?? "");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange("");
          }}
        />
        {open && filtered.length > 0 && (
          <div id={listId} className="station-picker-list" role="listbox">
            {filtered.map((s) => (
              <div key={s.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.key === value}
                  className={`station-picker-option ${s.key === value ? "station-picker-option--on" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s.key)}
                >
                  <span className="station-picker-option-name">{s.name}</span>
                  <span className="station-picker-option-net">
                    {s.network === "mta" ? "Subway" : "NJ Rail"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
        {open && query.trim() && filtered.length === 0 && (
          <p className="station-picker-empty">No stations match “{query.trim()}”.</p>
        )}
      </span>
    </label>
  );
}
