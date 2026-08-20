import { createMemo, For } from "solid-js";
import { useNavigate, useSearch } from "@tanstack/solid-router";
import { CadenceTable } from "~/components/ui/CadenceTable";
import { MetricCard } from "~/components/ui/MetricCard";
import { PresetChips } from "~/components/ui/PresetChips";
import { ToothInput } from "~/components/ui/ToothInput";
import { ALLOWED_CRANKS_MM, snapCrankMm } from "~/lib/gear/calculations";
import type { WheelSizeId } from "~/lib/gear/types";
import { parseWheelSize, WHEEL_SIZES } from "~/lib/gear/wheels";
import {
  formatDevelopment,
  formatGain,
  formatGearInches,
  formatRatio,
} from "~/lib/format";
import type { CalculatorSearch } from "~/lib/search";
import { prefs } from "~/lib/state/prefs-store";
import { useCurrentSetup } from "~/lib/state/setup-store";

const WHEEL_IDS: WheelSizeId[] = ["700c", "650b", "26in"];

const RATIO_TIP =
  "How many times the rear cog turns for one turn of the chainring: chainring teeth ÷ cog teeth.";
const DEVELOPMENT_TIP =
  "Distance the bike travels per pedal revolution (aka rollout). Approximated as gear ratio × wheel circumference, where diameter is bead-seat diameter plus twice the tire width.";
const GEAR_INCHES_TIP =
  "Classic inch-pitch equivalent: gear ratio × wheel diameter in inches. Diameter is bead-seat plus 2× tire width, the usual calculator approximation.";
const GAIN_TIP =
  "Sheldon Brown’s gain ratio: (wheel radius ÷ crank length) × gear ratio. Two bikes with the same gear inches but different cranks feel different; gain captures that.";
const SKID_TIP =
  "Distinct tire spots that hit the ground when you lock the cranks to skid. Count is cog ÷ gcd(ring, cog); doubled only when ambidextrous and the chainring has an odd tooth count. Two or fewer patches wear a tire out quickly.";

export function CalculatorPage() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const { metrics } = useCurrentSetup(search);

  const patch = (partial: Partial<CalculatorSearch>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...partial }),
      replace: true,
    });
  };

  const metricHero = createMemo(() => prefs.units === "metric");

  return (
    <div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
      <div class="lg:hidden">
        <details
          class="rounded-lg border border-ink/10 p-3 dark:border-paper/15"
          open
        >
          <summary class="cursor-pointer font-medium">Inputs</summary>
          <div class="mt-4">
            <SetupInputs bike={search()} onPatch={patch} />
          </div>
        </details>
      </div>
      <aside class="hidden lg:block">
        <SetupInputs bike={search()} onPatch={patch} />
      </aside>

      <section class="flex flex-col gap-8">
        <div class="grid gap-3 sm:grid-cols-2">
          <MetricCard
            label="Gear ratio"
            value={formatRatio(metrics().ratio)}
            tooltip={RATIO_TIP}
          />
          <MetricCard
            label={metricHero() ? "Development" : "Gear inches"}
            value={
              metricHero()
                ? formatDevelopment(metrics().developmentMeters)
                : formatGearInches(metrics().gearInches)
            }
            tooltip={metricHero() ? DEVELOPMENT_TIP : GEAR_INCHES_TIP}
          />
          <MetricCard
            label={metricHero() ? "Gear inches" : "Development"}
            value={
              metricHero()
                ? formatGearInches(metrics().gearInches)
                : formatDevelopment(metrics().developmentMeters)
            }
            tooltip={metricHero() ? GEAR_INCHES_TIP : DEVELOPMENT_TIP}
          />
          <MetricCard
            label="Gain ratio"
            value={formatGain(metrics().gainRatio)}
            tooltip={GAIN_TIP}
          />
          <MetricCard
            label="Skid patches"
            value={String(metrics().skidPatches)}
            tooltip={SKID_TIP}
            warning={metrics().skidPatches <= 2}
          />
        </div>

        <div>
          <h2 class="mb-3 text-sm font-medium uppercase tracking-wide opacity-70">
            Speed at cadence
          </h2>
          <CadenceTable speeds={metrics().speeds} units={prefs.units} />
        </div>
      </section>
    </div>
  );
}

function SetupInputs(props: {
  bike: CalculatorSearch;
  onPatch: (partial: Partial<CalculatorSearch>) => void;
}) {
  const wheel = createMemo(() => ({
    beadSeatDiameterMm: WHEEL_SIZES[props.bike.wheel].bsdMm,
    tireWidthMm: props.bike.tire,
  }));

  return (
    <div class="flex flex-col gap-5">
      <ToothInput
        label="Chainring teeth"
        value={props.bike.chainring}
        min={20}
        max={80}
        onChange={(chainring) => props.onPatch({ chainring })}
      />
      <ToothInput
        label="Cog teeth"
        value={props.bike.cog}
        min={9}
        max={30}
        onChange={(cog) => props.onPatch({ cog })}
      />
      <label class="flex flex-col gap-1 text-sm">
        Wheel size
        <select
          class="rounded border border-ink/20 bg-transparent px-2 py-1.5 dark:border-paper/20"
          aria-label="Wheel size"
          value={props.bike.wheel}
          onChange={(e) =>
            props.onPatch({ wheel: parseWheelSize(e.currentTarget.value) })
          }
        >
          <For each={WHEEL_IDS} keyed={(id) => id}>
            {(id) => <option value={id()}>{WHEEL_SIZES[id()].label}</option>}
          </For>
        </select>
      </label>
      <ToothInput
        label="Tire width"
        value={props.bike.tire}
        min={18}
        max={50}
        unit="mm"
        onChange={(tire) => props.onPatch({ tire })}
      />
      <label class="flex flex-col gap-1 text-sm">
        Crank length
        <select
          class="rounded border border-ink/20 bg-transparent px-2 py-1.5 dark:border-paper/20"
          aria-label="Crank length"
          value={String(props.bike.crank)}
          onChange={(e) =>
            props.onPatch({ crank: snapCrankMm(e.currentTarget.value) })
          }
        >
          <For each={ALLOWED_CRANKS_MM} keyed={(mm) => mm}>
            {(mm) => <option value={String(mm())}>{`${mm()} mm`}</option>}
          </For>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="accent-accent"
          aria-label="Ambidextrous skidder"
          checked={props.bike.ambi === 1}
          onChange={(e) =>
            props.onPatch({ ambi: e.currentTarget.checked ? 1 : 0 })
          }
        />
        Ambidextrous skidder
      </label>
      <PresetChips
        wheel={wheel()}
        onApply={(chainring, cog) => props.onPatch({ chainring, cog })}
      />
    </div>
  );
}
