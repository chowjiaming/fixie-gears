import { For, Show } from "solid-js";
import { CompareColumnHeader } from "~/components/compare/CompareColumnHeader";
import {
  formatDevelopment,
  formatGain,
  formatGearInches,
  formatRatio,
  formatSpeed,
} from "~/lib/format";
import { deriveMetrics } from "~/lib/gear/calculations";
import type { DerivedMetrics } from "~/lib/gear/types";
import {
  type CalculatorSearch,
  type CompareColumn,
  type CompareExtraSlot,
  type CompareSlot,
  toConfig,
} from "~/lib/search";
import type { Units } from "~/lib/state/prefs-store";

export interface CompareMetricCell {
  slot: CompareSlot;
  value: string;
  delta?: string;
  best?: boolean;
}

export interface CompareMetricRow {
  id: string;
  label: string;
  cells: CompareMetricCell[];
}

function signedDelta(
  delta: number,
  formatAbs: (n: number) => string,
): string | undefined {
  const formatted = formatAbs(Math.abs(delta));
  if (formatted === formatAbs(0)) return undefined;
  return `${delta > 0 ? "+" : "-"}${formatted}`;
}

function speedAt90(metrics: DerivedMetrics, units: Units): number {
  const row = metrics.speeds.find((s) => s.cadenceRpm === 90);
  if (!row) return 0;
  return units === "metric" ? row.speedKmh : row.speedMph;
}

function formatSpeedWithUnit(n: number, units: Units): string {
  return `${formatSpeed(n)} ${units === "metric" ? "km/h" : "mph"}`;
}

function numericRow(
  id: string,
  label: string,
  columns: CompareColumn[],
  values: number[],
  formatAbs: (n: number) => string,
  bestHigh?: boolean,
): CompareMetricRow {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const markBest = bestHigh === true && max > min;
  return {
    id,
    label,
    cells: columns.map((col, i) => {
      const value = values[i] ?? 0;
      const base = values[0] ?? 0;
      return {
        slot: col.slot,
        value: formatAbs(value),
        delta: i === 0 ? undefined : signedDelta(value - base, formatAbs),
        best: markBest && value === max,
      };
    }),
  };
}

export function compareMetricRows(
  columns: CompareColumn[],
  units: Units,
): CompareMetricRow[] {
  const metrics = columns.map((col) => deriveMetrics(toConfig(col.bike)));
  const heroIsDev = units === "metric";
  const speedUnit = (n: number) => formatSpeedWithUnit(n, units);

  const ratio = numericRow(
    "ratio",
    "Gear ratio",
    columns,
    metrics.map((m) => m.ratio),
    formatRatio,
  );
  const development = numericRow(
    "development",
    "Development",
    columns,
    metrics.map((m) => m.developmentMeters),
    formatDevelopment,
  );
  const gearInches = numericRow(
    "gearInches",
    "Gear inches",
    columns,
    metrics.map((m) => m.gearInches),
    formatGearInches,
  );
  const gain = numericRow(
    "gain",
    "Gain ratio",
    columns,
    metrics.map((m) => m.gainRatio),
    formatGain,
  );
  const skid = numericRow(
    "skid",
    "Skid patches",
    columns,
    metrics.map((m) => m.skidPatches),
    (n) => String(n),
    true,
  );
  const speed = numericRow(
    "speed90",
    "Speed at 90 rpm",
    columns,
    metrics.map((m) => speedAt90(m, units)),
    speedUnit,
  );

  return [
    ratio,
    heroIsDev ? development : gearInches,
    heroIsDev ? gearInches : development,
    gain,
    skid,
    speed,
  ];
}

const sticky = "sticky left-0 z-10 bg-paper dark:bg-ink";

export interface CompareTableProps {
  columns: CompareColumn[];
  units: Units;
  onChange: (slot: CompareSlot, partial: Partial<CalculatorSearch>) => void;
  onRemove: (slot: CompareExtraSlot) => void;
}

export function CompareTable(props: CompareTableProps) {
  const rows = () => compareMetricRows(props.columns, props.units);

  return (
    <div class="overflow-x-auto">
      <table class="w-max min-w-full border-separate border-spacing-0 text-sm">
        <caption class="sr-only">Setup comparison</caption>
        <thead>
          <tr>
            <th
              scope="col"
              class={`${sticky} border-b border-ink/10 px-3 py-2 text-left font-medium dark:border-paper/15`}
            >
              Metric
            </th>
            <For each={props.columns} keyed={(col) => col.slot}>
              {(col, i) => (
                <th
                  scope="col"
                  class="border-b border-l border-ink/10 px-3 py-2 align-top font-medium dark:border-paper/15"
                >
                  <CompareColumnHeader
                    index={i() + 1}
                    bike={col().bike}
                    removable={col().removable}
                    onChange={(partial) => props.onChange(col().slot, partial)}
                    onRemove={() => {
                      const slot = col().slot;
                      if (slot !== "c1") props.onRemove(slot);
                    }}
                  />
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={rows()} keyed={(row) => row.id}>
            {(row) => (
              <tr>
                <th
                  scope="row"
                  class={`${sticky} border-b border-ink/10 px-3 py-2 text-left font-medium dark:border-paper/15`}
                >
                  {row().label}
                </th>
                <For each={row().cells} keyed={(cell) => cell.slot}>
                  {(cell) => (
                    <td
                      class={[
                        "border-b border-l border-ink/10 px-3 py-2 tabular-nums dark:border-paper/15",
                        { "bg-accent/15": cell().best === true },
                      ]}
                    >
                      <span class="font-mono">{cell().value}</span>
                      <Show when={cell().delta}>
                        {(delta) => (
                          <span class="ml-2 text-xs opacity-70">{delta()}</span>
                        )}
                      </Show>
                      <Show when={cell().best}>
                        <span class="ml-2 text-xs font-medium text-accent-ink dark:text-accent">
                          <span aria-hidden="true">★ </span>
                          Best
                        </span>
                      </Show>
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
