import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { skidPatchAngles, skidPatchCount } from "~/lib/gear/skid";
import type { DrivetrainConfig } from "~/lib/gear/types";

export interface SkidVisualizerProps {
  config: DrivetrainConfig;
}

const RFF_FILL = "#FF5A1F";
const LFF_FILL = "#2A9D8F";

const VIEW = 200;
const CX = 100;
const CY = 100;
const DONUT_R = 66;
const DONUT_STROKE = 28;
const MARKER_R = 6;
/** Keep in sync with `.skid-marker` opacity duration in `styles.css`. */
const MARKER_FADE_MS = 200;

interface MarkerGeom {
  angle: number;
  index: number;
  fill: string;
}

interface MarkerView extends MarkerGeom {
  opacity: 0 | 1;
}

function isOddRing(teeth: number): boolean {
  return Math.round(teeth) % 2 === 1;
}

function skidAriaLabel(patchCount: number, evenRingAmbi: boolean): string {
  const patches =
    patchCount === 1
      ? "1 skid patch, evenly spaced."
      : `${patchCount} skid patches, evenly spaced.`;
  if (!evenRingAmbi) return patches;
  return `${patches} Opposite foot hits the same patches.`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
  );
}

function reconcileMarkerViews(
  prev: MarkerView[],
  next: MarkerGeom[],
  snap: boolean,
): MarkerView[] {
  const nextIds = new Set(next.map((m) => m.index));
  const prevById = new Map(prev.map((m) => [m.index, m]));
  const live: MarkerView[] = next.map((m) => {
    const was = prevById.get(m.index);
    const isNew = was === undefined;
    return { ...m, opacity: snap || !isNew ? 1 : 0 };
  });
  if (snap) return live;
  const leaving = prev
    .filter((p) => !nextIds.has(p.index))
    .map((p) => ({ ...p, opacity: 0 as const }));
  return [...live, ...leaving];
}

export function SkidVisualizer(props: SkidVisualizerProps) {
  const patchCount = createMemo(() =>
    skidPatchCount(
      props.config.chainringTeeth,
      props.config.cogTeeth,
      props.config.ambidextrousSkidder,
    ),
  );
  const twoTone = createMemo(
    () =>
      props.config.ambidextrousSkidder &&
      isOddRing(props.config.chainringTeeth),
  );
  const evenRingAmbi = createMemo(
    () =>
      props.config.ambidextrousSkidder &&
      !isOddRing(props.config.chainringTeeth),
  );
  const markers = createMemo((): MarkerGeom[] => {
    const split = twoTone();
    return skidPatchAngles(patchCount()).map((angle, index) => ({
      angle,
      index,
      fill: split && index % 2 === 1 ? LFF_FILL : RFF_FILL,
    }));
  });

  const [views, setViews] = createSignal<MarkerView[]>(
    markers().map((m) => ({ ...m, opacity: 1 })),
  );

  createEffect(
    () => markers(),
    (next) => {
      const snap = prefersReducedMotion();
      const merged = reconcileMarkerViews(views(), next, snap);
      setViews(merged);

      const nextIds = new Set(next.map((m) => m.index));
      const entering = merged.some(
        (m) => m.opacity === 0 && nextIds.has(m.index),
      );
      const leavingIds = merged
        .filter((m) => m.opacity === 0 && !nextIds.has(m.index))
        .map((m) => m.index);

      let raf1 = 0;
      let raf2 = 0;
      if (entering) {
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            setViews((cur) =>
              cur.map((m) => (nextIds.has(m.index) ? { ...m, opacity: 1 } : m)),
            );
          });
        });
      }

      let timer = 0;
      if (leavingIds.length > 0) {
        timer = window.setTimeout(() => {
          const drop = new Set(leavingIds);
          setViews((cur) => cur.filter((m) => !drop.has(m.index)));
        }, MARKER_FADE_MS);
      }

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        clearTimeout(timer);
      };
    },
  );

  return (
    <div class="flex flex-col items-center gap-3">
      <svg
        role="img"
        aria-label={skidAriaLabel(patchCount(), evenRingAmbi())}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        class="h-56 w-56 text-ink/20 dark:text-paper/20"
      >
        <circle
          cx={CX}
          cy={CY}
          r={DONUT_R}
          fill="none"
          stroke="currentColor"
          stroke-width={DONUT_STROKE}
        />
        <For each={views()} keyed={(m) => m.index}>
          {(m) => (
            <g
              class="skid-marker"
              style={{
                transform: `rotate(${m().angle}deg)`,
                opacity: m().opacity,
              }}
            >
              <circle
                data-skid-patch=""
                cx={CX}
                cy={CY - DONUT_R}
                r={MARKER_R}
                fill={m().fill}
              />
            </g>
          )}
        </For>
      </svg>
      <Show when={evenRingAmbi()}>
        <p class="text-center text-sm opacity-80">
          Opposite foot hits the same patches.
        </p>
      </Show>
      <Show when={twoTone()}>
        <ul class="flex gap-4 text-sm">
          <li class="flex items-center gap-2">
            <span
              class="inline-block h-2.5 w-2.5 rounded-full"
              style={{ "background-color": RFF_FILL }}
              aria-hidden="true"
            />
            Right foot (RFF)
          </li>
          <li class="flex items-center gap-2">
            <span
              class="inline-block h-2.5 w-2.5 rounded-full"
              style={{ "background-color": LFF_FILL }}
              aria-hidden="true"
            />
            Left foot (LFF)
          </li>
        </ul>
      </Show>
    </div>
  );
}
