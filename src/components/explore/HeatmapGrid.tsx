import { createMemo, For } from "solid-js";
import { deriveMetrics } from "~/lib/gear/calculations";
import { GOOD_SKID_PATCHES } from "~/lib/gear/skid";
import type { DerivedMetrics } from "~/lib/gear/types";
import {
  toConfig,
  type CalculatorSearch,
  type ExploreSearch,
} from "~/lib/search";

export const HEATMAP_RING_MIN = 38;
export const HEATMAP_RING_MAX = 60;
export const HEATMAP_COG_MIN = 11;
export const HEATMAP_COG_MAX = 23;

export const HEATMAP_RINGS: readonly number[] = Array.from(
  { length: HEATMAP_RING_MAX - HEATMAP_RING_MIN + 1 },
  (_, i) => HEATMAP_RING_MIN + i,
);

export const HEATMAP_COGS: readonly number[] = Array.from(
  { length: HEATMAP_COG_MAX - HEATMAP_COG_MIN + 1 },
  (_, i) => HEATMAP_COG_MIN + i,
);

export type HeatmapMetric = ExploreSearch["metric"];

export interface HeatmapCellData {
  ring: number;
  cog: number;
  gearInches: number;
  developmentMeters: number;
  skidPatches: number;
}

export interface DivergingScale {
  kind: "diverging";
  center: number;
  halfRange: number;
}

export interface SequentialScale {
  kind: "sequential";
  min: number;
  max: number;
}

export type HeatmapScale = DivergingScale | SequentialScale;

type Rgb = readonly [number, number, number];

const RGB_BLUE: Rgb = [37, 99, 166];
const RGB_CENTER: Rgb = [250, 250, 248];
const RGB_ORANGE: Rgb = [255, 90, 31];
const RGB_SKID_PALE: Rgb = [235, 247, 236];
const RGB_SKID_GREEN: Rgb = [22, 128, 57];

const RING_COLUMNS = `repeat(${HEATMAP_RINGS.length}, minmax(1.75rem, 1fr))`;

export interface HeatmapGridProps {
  bike: CalculatorSearch;
  metric: HeatmapMetric;
  minSkid: ExploreSearch["minSkid"];
  onMetricChange: (metric: HeatmapMetric) => void;
  onMinSkidChange: (minSkid: ExploreSearch["minSkid"]) => void;
  onSelect: (chainring: number, cog: number) => void;
}

export function isInHeatmapWindow(ring: number, cog: number): boolean {
  return (
    ring >= HEATMAP_RING_MIN &&
    ring <= HEATMAP_RING_MAX &&
    cog >= HEATMAP_COG_MIN &&
    cog <= HEATMAP_COG_MAX
  );
}

export function cellMetricValue(
  cell: HeatmapCellData,
  metric: HeatmapMetric,
): number {
  if (metric === "gi") return cell.gearInches;
  if (metric === "dev") return cell.developmentMeters;
  return cell.skidPatches;
}

export function metricsMetricValue(
  metrics: DerivedMetrics,
  metric: HeatmapMetric,
): number {
  if (metric === "gi") return metrics.gearInches;
  if (metric === "dev") return metrics.developmentMeters;
  return metrics.skidPatches;
}

export function heatmapAriaLabel(
  ring: number,
  cog: number,
  value: number,
  metric: HeatmapMetric,
): string {
  return `${ring} tooth chainring, ${cog} tooth cog, ${heatmapAriaValue(value, metric)}`;
}

export function heatmapAriaValue(value: number, metric: HeatmapMetric): string {
  if (metric === "gi") return `${value.toFixed(1)} gear inches`;
  if (metric === "dev") return `${value.toFixed(2)} m development`;
  const n = Math.round(value);
  return n === 1 ? "1 skid patch" : `${n} skid patches`;
}

export function heatmapShortValue(
  value: number,
  metric: HeatmapMetric,
): string {
  if (metric === "gi") return value.toFixed(1);
  if (metric === "dev") return value.toFixed(2);
  return String(Math.round(value));
}

/**
 * Sequential green for skid; diverging blue↔orange for gi/dev, centered
 * on the current setup. Values outside the domain clamp to the endpoints.
 */
export function heatmapFill(value: number, scale: HeatmapScale): string {
  if (scale.kind === "sequential") {
    const span = scale.max - scale.min;
    const t = span <= 0 ? 1 : (value - scale.min) / span;
    return mixRgb(RGB_SKID_PALE, RGB_SKID_GREEN, t);
  }
  if (scale.halfRange <= 0) return mixRgb(RGB_CENTER, RGB_CENTER, 0);
  const t = (value - scale.center) / scale.halfRange;
  const clamped = Math.min(1, Math.max(-1, t));
  if (clamped < 0) return mixRgb(RGB_BLUE, RGB_CENTER, clamped + 1);
  return mixRgb(RGB_CENTER, RGB_ORANGE, clamped);
}

export function buildHeatmapScale(
  metric: HeatmapMetric,
  values: readonly number[],
  center: number,
): HeatmapScale {
  if (metric === "skid") {
    const max = values.reduce((m, v) => Math.max(m, v), 0);
    return { kind: "sequential", min: 0, max: Math.max(max, 1) };
  }
  let halfRange = 0;
  for (const v of values) {
    halfRange = Math.max(halfRange, Math.abs(v - center));
  }
  return { kind: "diverging", center, halfRange };
}

export function buildHeatmapCells(bike: CalculatorSearch): HeatmapCellData[] {
  const base = toConfig(bike);
  const cells: HeatmapCellData[] = [];
  for (const cog of HEATMAP_COGS) {
    for (const ring of HEATMAP_RINGS) {
      const metrics = deriveMetrics({
        ...base,
        chainringTeeth: ring,
        cogTeeth: cog,
      });
      cells.push({
        ring,
        cog,
        gearInches: metrics.gearInches,
        developmentMeters: metrics.developmentMeters,
        skidPatches: metrics.skidPatches,
      });
    }
  }
  return cells;
}

function requireCell(
  map: Map<string, HeatmapCellData>,
  ring: number,
  cog: number,
): HeatmapCellData {
  const found = map.get(`${ring}/${cog}`);
  if (!found) {
    throw new Error(`missing heatmap cell ${ring}/${cog}`);
  }
  return found;
}

function mixRgb(a: Rgb, b: Rgb, t: number): string {
  const u = Math.min(1, Math.max(0, t));
  const r = Math.round(a[0] + (b[0] - a[0]) * u);
  const g = Math.round(a[1] + (b[1] - a[1]) * u);
  const bch = Math.round(a[2] + (b[2] - a[2]) * u);
  return `rgb(${r} ${g} ${bch})`;
}

export function HeatmapGrid(props: HeatmapGridProps) {
  const cells = createMemo(() =>
    buildHeatmapCells({
      v: 1,
      chainring: HEATMAP_RING_MIN,
      cog: HEATMAP_COG_MIN,
      wheel: props.bike.wheel,
      tire: props.bike.tire,
      crank: props.bike.crank,
      ambi: props.bike.ambi,
      stay: props.bike.stay,
      ...(props.bike.circ !== undefined ? { circ: props.bike.circ } : {}),
    }),
  );

  const byKey = createMemo(() => {
    const map = new Map<string, HeatmapCellData>();
    for (const cell of cells()) {
      map.set(`${cell.ring}/${cell.cog}`, cell);
    }
    return map;
  });

  const center = createMemo(() =>
    metricsMetricValue(deriveMetrics(toConfig(props.bike)), props.metric),
  );

  const scale = createMemo(() =>
    buildHeatmapScale(
      props.metric,
      cells().map((cell) => cellMetricValue(cell, props.metric)),
      center(),
    ),
  );

  const legendMin = createMemo(() => {
    const s = scale();
    return s.kind === "sequential" ? s.min : s.center - s.halfRange;
  });

  const legendMax = createMemo(() => {
    const s = scale();
    return s.kind === "sequential" ? s.max : s.center + s.halfRange;
  });

  const dimFilterOn = () => props.minSkid === GOOD_SKID_PATCHES;

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-medium">Metric</legend>
          <div class="flex flex-wrap gap-3 text-sm">
            <MetricRadio
              metric="gi"
              label="Gear inches"
              selected={props.metric}
              onChange={props.onMetricChange}
            />
            <MetricRadio
              metric="dev"
              label="Development"
              selected={props.metric}
              onChange={props.onMetricChange}
            />
            <MetricRadio
              metric="skid"
              label="Skid patches"
              selected={props.metric}
              onChange={props.onMetricChange}
            />
          </div>
        </fieldset>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="accent-accent"
            aria-label="Dim setups with fewer than 8 skid patches"
            checked={dimFilterOn()}
            onChange={(e) =>
              props.onMinSkidChange(
                e.currentTarget.checked ? GOOD_SKID_PATCHES : 0,
              )
            }
          />
          ≥{GOOD_SKID_PATCHES} skid patches
        </label>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 text-xs opacity-70">
          <span class="tabular-nums">
            {heatmapShortValue(legendMin(), props.metric)}
          </span>
          <div
            class="h-3 min-w-32 flex-1 rounded-sm"
            style={{
              background:
                props.metric === "skid"
                  ? `linear-gradient(to right, ${mixRgb(RGB_SKID_PALE, RGB_SKID_PALE, 0)}, ${mixRgb(RGB_SKID_GREEN, RGB_SKID_GREEN, 1)})`
                  : `linear-gradient(to right, ${mixRgb(RGB_BLUE, RGB_BLUE, 0)}, ${mixRgb(RGB_CENTER, RGB_CENTER, 0)}, ${mixRgb(RGB_ORANGE, RGB_ORANGE, 1)})`,
            }}
          />
          <span class="tabular-nums">
            {heatmapShortValue(legendMax(), props.metric)}
          </span>
        </div>
        <p class="text-xs opacity-70">
          {props.metric === "skid"
            ? "Sequential green: more skid patches are darker."
            : "Diverging scale centered on this setup. Blue is easier, orange is harder."}
        </p>
      </div>

      <div class="overflow-x-auto">
        <div
          class="grid min-w-[44rem] gap-1"
          style={{ "grid-template-columns": "auto 1fr" }}
          role="group"
          aria-label="Chainring by cog heatmap"
        >
          <div aria-hidden="true" />
          <div
            class="grid gap-1"
            style={{ "grid-template-columns": RING_COLUMNS }}
          >
            <For each={HEATMAP_RINGS} keyed={(ring) => ring}>
              {(ring) => (
                <div
                  class="text-center text-[10px] tabular-nums opacity-70"
                  aria-hidden="true"
                >
                  {ring()}
                </div>
              )}
            </For>
          </div>
          <For each={HEATMAP_COGS} keyed={(cog) => cog}>
            {(cog) => (
              <div class="contents">
                <div
                  class="flex items-center pr-1 text-[10px] tabular-nums opacity-70"
                  aria-hidden="true"
                >
                  {cog()}
                </div>
                <div
                  class="grid gap-1"
                  style={{ "grid-template-columns": RING_COLUMNS }}
                >
                  <For each={HEATMAP_RINGS} keyed={(ring) => ring}>
                    {(ring) => {
                      const data = () => requireCell(byKey(), ring(), cog());
                      const value = () => cellMetricValue(data(), props.metric);
                      return (
                        <HeatmapCell
                          ring={ring()}
                          cog={cog()}
                          value={value()}
                          fill={heatmapFill(value(), scale())}
                          dimmed={
                            dimFilterOn() &&
                            data().skidPatches < GOOD_SKID_PATCHES
                          }
                          current={
                            isInHeatmapWindow(
                              props.bike.chainring,
                              props.bike.cog,
                            ) &&
                            ring() === props.bike.chainring &&
                            cog() === props.bike.cog
                          }
                          metric={props.metric}
                          onSelect={props.onSelect}
                        />
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

function MetricRadio(props: {
  metric: HeatmapMetric;
  label: string;
  selected: HeatmapMetric;
  onChange: (metric: HeatmapMetric) => void;
}) {
  return (
    <label class="flex items-center gap-1.5">
      <input
        type="radio"
        name="explore-metric"
        class="accent-accent"
        value={props.metric}
        checked={props.selected === props.metric}
        onChange={() => props.onChange(props.metric)}
      />
      {props.label}
    </label>
  );
}

function HeatmapCell(props: {
  ring: number;
  cog: number;
  value: number;
  fill: string;
  dimmed: boolean;
  current: boolean;
  metric: HeatmapMetric;
  onSelect: (chainring: number, cog: number) => void;
}) {
  const label = () =>
    heatmapAriaLabel(props.ring, props.cog, props.value, props.metric);

  return (
    <button
      type="button"
      aria-label={label()}
      aria-current={props.current ? "true" : undefined}
      title={`${props.ring}/${props.cog} · ${heatmapAriaValue(props.value, props.metric)}`}
      class={[
        "group relative flex aspect-square min-h-8 min-w-8 items-center justify-center rounded-sm text-[10px] leading-none",
        {
          "opacity-35": props.dimmed,
          "z-10 outline outline-2 outline-accent outline-offset-0":
            props.current,
        },
      ]}
      style={{ "background-color": props.fill }}
      onClick={() => props.onSelect(props.ring, props.cog)}
    >
      <span class="pointer-events-none rounded bg-paper/90 px-0.5 tabular-nums text-ink opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        {heatmapShortValue(props.value, props.metric)}
      </span>
    </button>
  );
}
